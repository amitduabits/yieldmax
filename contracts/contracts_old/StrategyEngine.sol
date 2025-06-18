// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStrategyEngine.sol";

/**
 * @title StrategyEngine
 * @notice AI-powered yield optimization using Chainlink Functions
 * @dev Fetches yield data from DeFi protocols and calculates optimal allocations
 */
contract StrategyEngine is IStrategyEngine, FunctionsClient, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    // ==================== CONSTANTS ====================
    uint256 private constant MIN_YIELD_DIFFERENCE = 50; // 0.5% in basis points
    uint256 private constant MAX_RISK_SCORE = 1000; // Risk score scale
    uint256 private constant GAS_COST_BUFFER = 120; // 20% buffer for gas costs
    
    // ==================== STATE VARIABLES ====================
    bytes32 public donHostedSecretsSlotId;
    uint64 public donHostedSecretsVersion;
    
    mapping(bytes32 => RequestStatus) public requests;
    mapping(address => ProtocolYield) public protocolYields;
    address[] public supportedProtocols;
    
    bytes32 public latestRequestId;
    bytes public latestResponse;
    bytes public latestError;
    
    OptimalStrategy public currentStrategy;
    
    // Chainlink Functions configuration
    address public functionsRouter;
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public gasLimit = 300_000;
    
    // ==================== STRUCTS ====================
    struct RequestStatus {
        bool fulfilled;
        bool exists;
        bytes response;
        bytes error;
    }
    
    struct ProtocolYield {
        uint256 apy;
        uint256 tvl;
        uint256 riskScore;
        uint256 lastUpdate;
        bool active;
    }
    
    struct OptimalStrategy {
        address protocol;
        uint256 expectedYield;
        uint256 confidence;
        uint256 gasEstimate;
        uint256 timestamp;
    }
    
    // ==================== EVENTS ====================
    event YieldDataRequested(bytes32 indexed requestId);
    event YieldDataReceived(bytes32 indexed requestId, bytes response);
    event OptimalStrategyCalculated(address protocol, uint256 expectedYield);
    event ProtocolAdded(address protocol);
    event ProtocolRemoved(address protocol);
    
    // ==================== CONSTRUCTOR ====================
    constructor(
        address _functionsRouter,
        bytes32 _donId,
        uint64 _subscriptionId
    ) FunctionsClient(_functionsRouter) Ownable(msg.sender) {
        functionsRouter = _functionsRouter;
        donId = _donId;
        subscriptionId = _subscriptionId;
    }
    
    // ==================== EXTERNAL FUNCTIONS ====================
    
    /**
     * @notice Request yield data from external sources
     * @return requestId The ID of the Functions request
     */
    function requestYieldUpdate() external onlyOwner returns (bytes32) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(_getYieldFetchScript());
        
        // Optional: Add secrets for API keys
        if (donHostedSecretsVersion > 0) {
            req.addDONHostedSecrets(
                donHostedSecretsSlotId,
                donHostedSecretsVersion
            );
        }
        
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );
        
        requests[requestId] = RequestStatus({
            fulfilled: false,
            exists: true,
            response: "",
            error: ""
        });
        
        latestRequestId = requestId;
        emit YieldDataRequested(requestId);
        
        return requestId;
    }
    
    /**
     * @notice Calculate optimal yield allocation
     * @param userBalance User's balance to optimize
     * @param riskTolerance Risk tolerance (0-1000)
     * @return strategy The optimal strategy
     */
    function calculateOptimalAllocation(
        uint256 userBalance,
        uint256 riskTolerance
    ) external view override returns (
        address protocol,
        uint256 expectedYield,
        uint256 confidence
    ) {
        require(supportedProtocols.length > 0, "No protocols");
        
        uint256 bestScore = 0;
        address bestProtocol = address(0);
        
        for (uint256 i = 0; i < supportedProtocols.length; i++) {
            address proto = supportedProtocols[i];
            ProtocolYield memory yield = protocolYields[proto];
            
            if (!yield.active || yield.tvl < userBalance) continue;
            
            // Calculate weighted score
            uint256 yieldScore = yield.apy * 40 / 100;
            uint256 safetyScore = (MAX_RISK_SCORE - yield.riskScore) * 30 / MAX_RISK_SCORE / 100;
            uint256 liquidityScore = _calculateLiquidityScore(yield.tvl, userBalance) * 20 / 100;
            uint256 gasScore = _calculateGasEfficiency(proto) * 10 / 100;
            
            uint256 totalScore = yieldScore + safetyScore + liquidityScore + gasScore;
            
            // Apply risk tolerance weighting
            if (riskTolerance < 500) {
                // Conservative: Prioritize safety
                totalScore = (totalScore * 70 + safetyScore * 30) / 100;
            } else if (riskTolerance > 700) {
                // Aggressive: Prioritize yield
                totalScore = (totalScore * 70 + yieldScore * 30) / 100;
            }
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestProtocol = proto;
            }
        }
        
        require(bestProtocol != address(0), "No suitable protocol");
        
        return (
            bestProtocol,
            protocolYields[bestProtocol].apy,
            bestScore
        );
    }
    
    /**
     * @notice Add a new protocol to track
     * @param protocol Protocol address
     */
    function addProtocol(address protocol) external onlyOwner {
        require(protocol != address(0), "Invalid protocol");
        require(!protocolYields[protocol].active, "Already added");
        
        supportedProtocols.push(protocol);
        protocolYields[protocol].active = true;
        
        emit ProtocolAdded(protocol);
    }
    
    /**
     * @notice Remove a protocol
     * @param protocol Protocol address
     */
    function removeProtocol(address protocol) external onlyOwner {
        require(protocolYields[protocol].active, "Not active");
        
        protocolYields[protocol].active = false;
        
        // Remove from array
        for (uint256 i = 0; i < supportedProtocols.length; i++) {
            if (supportedProtocols[i] == protocol) {
                supportedProtocols[i] = supportedProtocols[supportedProtocols.length - 1];
                supportedProtocols.pop();
                break;
            }
        }
        
        emit ProtocolRemoved(protocol);
    }
    
    // ==================== CHAINLINK FUNCTIONS ====================
    
    /**
     * @notice Fulfill Functions request
     * @dev Called by Chainlink Functions Router
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory error
    ) internal override {
        require(requests[requestId].exists, "Request not found");
        
        requests[requestId].fulfilled = true;
        requests[requestId].response = response;
        requests[requestId].error = error;
        
        latestResponse = response;
        latestError = error;
        
        if (error.length == 0) {
            _processYieldData(response);
            emit YieldDataReceived(requestId, response);
        }
    }
    
    /**
     * @notice Process yield data from Functions response
     * @param data Encoded yield data
     */
    function _processYieldData(bytes memory data) private {
        // Decode the response
        (
            address[] memory protocols,
            uint256[] memory apys,
            uint256[] memory tvls,
            uint256[] memory risks
        ) = abi.decode(data, (address[], uint256[], uint256[], uint256[]));
        
        require(protocols.length == apys.length, "Invalid data");
        require(protocols.length == tvls.length, "Invalid data");
        require(protocols.length == risks.length, "Invalid data");
        
        // Update protocol yields
        for (uint256 i = 0; i < protocols.length; i++) {
            if (protocolYields[protocols[i]].active) {
                protocolYields[protocols[i]] = ProtocolYield({
                    apy: apys[i],
                    tvl: tvls[i],
                    riskScore: risks[i],
                    lastUpdate: block.timestamp,
                    active: true
                });
            }
        }
        
        // Update current optimal strategy
        (address optimalProtocol, uint256 expectedYield, uint256 confidence) = 
            this.calculateOptimalAllocation(1e24, 500); // Default calculation
            
        currentStrategy = OptimalStrategy({
            protocol: optimalProtocol,
            expectedYield: expectedYield,
            confidence: confidence,
            gasEstimate: _estimateGasCost(optimalProtocol),
            timestamp: block.timestamp
        });
        
        emit OptimalStrategyCalculated(optimalProtocol, expectedYield);
    }
    
    /**
     * @notice JavaScript code for fetching yield data
     * @return JavaScript source code
     */
    function _getYieldFetchScript() private pure returns (string memory) {
        return string(
            abi.encodePacked(
                "const protocols = ['0x...', '0x...', '0x...']; ", // Protocol addresses
                "const results = await Promise.all(protocols.map(async (protocol) => { ",
                "  try { ",
                "    const apiUrl = `https://api.defillama.com/protocol/${protocol}`; ",
                "    const response = await Functions.makeHttpRequest({ url: apiUrl }); ",
                "    const data = response.data; ",
                "    return { ",
                "      protocol: protocol, ",
                "      apy: Math.floor(data.apy * 100), ", // Convert to basis points
                "      tvl: data.tvl, ",
                "      risk: calculateRiskScore(data) ",
                "    }; ",
                "  } catch (error) { ",
                "    return { protocol: protocol, apy: 0, tvl: 0, risk: 1000 }; ",
                "  } ",
                "})); ",
                "",
                "function calculateRiskScore(data) { ",
                "  let score = 0; ",
                "  if (data.audited) score += 200; ",
                "  if (data.timeActive > 365) score += 300; ",
                "  if (data.tvl > 100000000) score += 300; ",
                "  if (data.category === 'Lending') score += 200; ",
                "  return 1000 - score; ",
                "} ",
                "",
                "const protocols_array = results.map(r => r.protocol); ",
                "const apys = results.map(r => r.apy); ",
                "const tvls = results.map(r => r.tvl); ",
                "const risks = results.map(r => r.risk); ",
                "",
                "return Functions.encodeUint256Array([...protocols_array, ...apys, ...tvls, ...risks]); "
            )
        );
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @notice Calculate liquidity score based on TVL
     * @param tvl Total value locked
     * @param userBalance User's balance
     * @return score Liquidity score (0-100)
     */
    function _calculateLiquidityScore(
        uint256 tvl,
        uint256 userBalance
    ) private pure returns (uint256) {
        if (tvl > userBalance * 1000) return 100;
        if (tvl > userBalance * 100) return 80;
        if (tvl > userBalance * 10) return 60;
        return 40;
    }
    
    /**
     * @notice Calculate gas efficiency score
     * @param protocol Protocol address
     * @return score Gas efficiency score (0-100)
     */
    function _calculateGasEfficiency(address protocol) private pure returns (uint256) {
        // Simplified gas estimation - in production, would use historical data
        if (protocol == address(0x1)) return 90; // Ethereum mainnet protocols
        if (protocol == address(0x2)) return 95; // L2 protocols
        return 85; // Default
    }
    
    /**
     * @notice Estimate gas cost for a protocol
     * @param protocol Protocol address
     * @return gasEstimate Estimated gas cost in wei
     */
    function _estimateGasCost(address protocol) private pure returns (uint256) {
        // Simplified estimation
        uint256 baseGas = 150_000;
        if (protocol == address(0x1)) baseGas = 200_000; // Mainnet
        if (protocol == address(0x2)) baseGas = 100_000; // L2
        
        return baseGas * 50 gwei; // Assume 50 gwei gas price
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @notice Get current optimal strategy
     * @return strategy Current optimal strategy
     */
    function getCurrentStrategy() external view returns (OptimalStrategy memory) {
        return currentStrategy;
    }
    
    /**
     * @notice Get all supported protocols
     * @return protocols Array of protocol addresses
     */
    function getSupportedProtocols() external view returns (address[] memory) {
        return supportedProtocols;
    }
    
    /**
     * @notice Get protocol yield data
     * @param protocol Protocol address
     * @return yield Protocol yield information
     */
    function getProtocolYield(address protocol) external view returns (ProtocolYield memory) {
        return protocolYields[protocol];
    }
}