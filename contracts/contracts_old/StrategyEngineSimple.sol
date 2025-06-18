// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StrategyEngineSimple
 * @notice Simplified strategy engine for hackathon demo
 * @dev Can be upgraded to use Chainlink Functions later
 */
contract StrategyEngineSimple is Ownable {
    // ==================== STATE VARIABLES ====================
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
    
    mapping(address => ProtocolYield) public protocolYields;
    address[] public supportedProtocols;
    OptimalStrategy public currentStrategy;
    
    uint256 private constant MIN_YIELD_DIFFERENCE = 50; // 0.5% in basis points
    uint256 private constant MAX_RISK_SCORE = 1000;
    
    // ==================== EVENTS ====================
    event YieldDataUpdated(address indexed protocol, uint256 apy);
    event OptimalStrategyCalculated(address protocol, uint256 expectedYield);
    event ProtocolAdded(address protocol);
    event ProtocolRemoved(address protocol);
    
    // ==================== CONSTRUCTOR ====================
    constructor() Ownable(msg.sender) {
        // Initialize with some default protocols and mock data
        _addDefaultProtocols();
    }
    
    // ==================== EXTERNAL FUNCTIONS ====================
    
    /**
     * @notice Request yield update (mock implementation)
     * @return requestId Mock request ID
     */
    function requestYieldUpdate() external onlyOwner returns (bytes32) {
        // In production, this would call Chainlink Functions
        // For now, we'll update with mock data
        _updateMockYields();
        
        // Calculate new optimal strategy
        _recalculateOptimalStrategy();
        
        return keccak256(abi.encodePacked(block.timestamp, msg.sender));
    }
    
    /**
     * @notice Calculate optimal yield allocation
     */
    function calculateOptimalAllocation(
        uint256 userBalance,
        uint256 riskTolerance
    ) external view returns (
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
            uint256 yieldScore = (yield.apy * 40) / 100;
            uint256 safetyScore = ((MAX_RISK_SCORE - yield.riskScore) * 30) / MAX_RISK_SCORE / 100;
            uint256 liquidityScore = (_calculateLiquidityScore(yield.tvl, userBalance) * 20) / 100;
            uint256 gasScore = 10; // Simplified gas score
            
            uint256 totalScore = yieldScore + safetyScore + liquidityScore + gasScore;
            
            // Apply risk tolerance
            if (riskTolerance < 500) {
                totalScore = (totalScore * 70 + safetyScore * 30) / 100;
            } else if (riskTolerance > 700) {
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
     * @notice Get current optimal strategy
     */
    function getCurrentStrategy() external view returns (
        address protocol,
        uint256 expectedYield,
        uint256 confidence,
        uint256 gasEstimate,
        uint256 timestamp
    ) {
        return (
            currentStrategy.protocol,
            currentStrategy.expectedYield,
            currentStrategy.confidence,
            currentStrategy.gasEstimate,
            currentStrategy.timestamp
        );
    }
    
    /**
     * @notice Add a new protocol
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
     */
    function removeProtocol(address protocol) external onlyOwner {
        require(protocolYields[protocol].active, "Not active");
        
        protocolYields[protocol].active = false;
        
        for (uint256 i = 0; i < supportedProtocols.length; i++) {
            if (supportedProtocols[i] == protocol) {
                supportedProtocols[i] = supportedProtocols[supportedProtocols.length - 1];
                supportedProtocols.pop();
                break;
            }
        }
        
        emit ProtocolRemoved(protocol);
    }
    
    /**
     * @notice Get all supported protocols
     */
    function getSupportedProtocols() external view returns (address[] memory) {
        return supportedProtocols;
    }
    
    /**
     * @notice Get protocol yield data
     */
    function getProtocolYield(address protocol) external view returns (
        uint256 apy,
        uint256 tvl,
        uint256 riskScore,
        uint256 lastUpdate,
        bool active
    ) {
        ProtocolYield memory yield = protocolYields[protocol];
        return (yield.apy, yield.tvl, yield.riskScore, yield.lastUpdate, yield.active);
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @notice Add default protocols with mock data
     */
    function _addDefaultProtocols() private {
        // Uniswap V3
        address uniswapV3 = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
        supportedProtocols.push(uniswapV3);
        protocolYields[uniswapV3] = ProtocolYield({
            apy: 850, // 8.5%
            tvl: 1000000 * 1e6, // $1M
            riskScore: 200,
            lastUpdate: block.timestamp,
            active: true
        });
        
        // Aave
        address aave = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        supportedProtocols.push(aave);
        protocolYields[aave] = ProtocolYield({
            apy: 620, // 6.2%
            tvl: 5000000 * 1e6, // $5M
            riskScore: 100,
            lastUpdate: block.timestamp,
            active: true
        });
        
        // Compound
        address compound = 0x1111111254fb6c44bAC0beD2854e76F90643097d;
        supportedProtocols.push(compound);
        protocolYields[compound] = ProtocolYield({
            apy: 580, // 5.8%
            tvl: 3000000 * 1e6, // $3M
            riskScore: 150,
            lastUpdate: block.timestamp,
            active: true
        });
    }
    
    /**
     * @notice Update yields with mock data
     */
    function _updateMockYields() private {
        // Simulate yield changes
        for (uint256 i = 0; i < supportedProtocols.length; i++) {
            address protocol = supportedProtocols[i];
            ProtocolYield storage yield = protocolYields[protocol];
            
            // Random-ish yield changes based on block data
            uint256 change = uint256(keccak256(abi.encodePacked(block.timestamp, protocol, i))) % 100;
            
            if (change > 50) {
                yield.apy = yield.apy + (change % 50);
            } else {
                yield.apy = yield.apy > (change % 50) ? yield.apy - (change % 50) : yield.apy;
            }
            
            yield.lastUpdate = block.timestamp;
            
            emit YieldDataUpdated(protocol, yield.apy);
        }
    }
    
    /**
     * @notice Recalculate optimal strategy
     */
    function _recalculateOptimalStrategy() private {
        (address protocol, uint256 expectedYield, uint256 confidence) = 
            this.calculateOptimalAllocation(1000000 * 1e6, 500);
            
        currentStrategy = OptimalStrategy({
            protocol: protocol,
            expectedYield: expectedYield,
            confidence: confidence,
            gasEstimate: 0.001 ether,
            timestamp: block.timestamp
        });
        
        emit OptimalStrategyCalculated(protocol, expectedYield);
    }
    
    /**
     * @notice Calculate liquidity score
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
}