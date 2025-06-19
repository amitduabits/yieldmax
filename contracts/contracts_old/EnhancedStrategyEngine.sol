// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IYieldMaxFunctionsConsumer {
    struct YieldData {
        uint256 aaveAPY;
        uint256 compoundAPY;
        uint256 yearnAPY;
        uint256 curveAPY;
        uint256 lastUpdate;
        bool isValid;
    }
    
    function getCurrentYields() external view returns (YieldData memory);
    function getBestYield(uint256 amount) external view returns (string memory protocol, uint256 expectedAPY);
    function requestYieldData() external returns (bytes32);
    function isDataFresh() external view returns (bool);
}

/**
 * @title EnhancedStrategyEngine
 * @notice Advanced yield optimization engine with real-time DeFi integration
 * @dev Production-ready strategy engine for YieldMax protocol
 */
contract EnhancedStrategyEngine is AccessControl, ReentrancyGuard, Pausable {
    
    // ==================== ROLES ====================
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    // ==================== STRUCTS ====================
    struct Protocol {
        address protocolAddress;
        string name;
        uint256 weight; // Weight in basis points (10000 = 100%)
        bool isActive;
        uint256 totalAllocated;
        uint256 lastUpdate;
    }

    struct Strategy {
        string protocolName;
        uint256 allocation; // Percentage in basis points
        uint256 expectedAPY;
        uint256 riskScore; // 0-100, lower is safer
        uint256 confidence; // 0-100, higher is more confident
        uint256 timestamp;
    }

    struct AllocationResult {
        string[] protocols;
        uint256[] allocations;
        uint256[] expectedAPYs;
        uint256 totalExpectedAPY;
        uint256 riskScore;
        uint256 timestamp;
    }

    struct RiskParameters {
        uint256 maxAllocationPerProtocol; // In basis points
        uint256 minDiversification; // Minimum number of protocols
        uint256 maxRiskScore; // Maximum acceptable risk score
        uint256 rebalanceThreshold; // Threshold for triggering rebalance
    }

    // ==================== STATE VARIABLES ====================
    IYieldMaxFunctionsConsumer public functionsConsumer;
    
    mapping(address => Protocol) public protocols;
    mapping(string => address) public protocolsByName;
    address[] public protocolAddresses;
    
    Strategy public currentStrategy;
    AllocationResult public lastAllocation;
    RiskParameters public riskParams;
    
    uint256 public totalAssets;
    uint256 public lastRebalance;
    uint256 public rebalanceInterval;
    
    // ==================== EVENTS ====================
    event ProtocolAdded(address indexed protocolAddress, string name, uint256 weight);
    event ProtocolUpdated(address indexed protocolAddress, string name, uint256 weight, bool isActive);
    event StrategyUpdated(string protocolName, uint256 allocation, uint256 expectedAPY);
    event AllocationCalculated(string[] protocols, uint256[] allocations, uint256 totalAPY);
    event RebalanceExecuted(uint256 totalAssets, uint256 newAPY, uint256 gasUsed);
    event FunctionsConsumerUpdated(address newConsumer);
    event RiskParametersUpdated(
        uint256 maxAllocationPerProtocol,
        uint256 minDiversification,
        uint256 maxRiskScore
    );

    // ==================== ERRORS ====================
    error ProtocolNotFound(address protocol);
    error InvalidAllocation(uint256 allocation);
    error InsufficientDiversification(uint256 protocols, uint256 minimum);
    error RiskTooHigh(uint256 riskScore, uint256 maximum);
    error DataNotFresh();
    error NoActiveProtocols();
    error RebalanceTooSoon(uint256 timeRemaining);

    // ==================== CONSTRUCTOR ====================
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);

        // Initialize risk parameters
        riskParams = RiskParameters({
            maxAllocationPerProtocol: 4000, // 40% max per protocol
            minDiversification: 2, // At least 2 protocols
            maxRiskScore: 70, // Max risk score of 70
            rebalanceThreshold: 200 // 2% threshold for rebalance
        });

        rebalanceInterval = 3600; // 1 hour minimum between rebalances
    }

    // ==================== MAIN FUNCTIONS ====================

    /**
     * @notice Calculate optimal allocation based on current yields and risk
     * @param assets Total assets to allocate
     * @return protocols Array of protocol names
     * @return allocations Array of allocation percentages (basis points)
     * @return expectedAPYs Array of expected APYs for each allocation
     */
    function calculateOptimalAllocation(uint256 assets) 
        external 
        view 
        returns (
            string[] memory protocols,
            uint256[] memory allocations,
            uint256[] memory expectedAPYs
        ) 
    {
        require(address(functionsConsumer) != address(0), "Functions consumer not set");
        require(functionsConsumer.isDataFresh(), "Yield data not fresh");

        // Get current yield data
        IYieldMaxFunctionsConsumer.YieldData memory yieldData = functionsConsumer.getCurrentYields();
        require(yieldData.isValid, "Invalid yield data");

        // Create arrays for active protocols with yields
        string[] memory availableProtocols = new string[](4);
        uint256[] memory yields = new uint256[](4);
        uint256[] memory risks = new uint256[](4);
        uint256 activeCount = 0;

        // Add active protocols
        if (_isProtocolActive("Aave") && yieldData.aaveAPY > 0) {
            availableProtocols[activeCount] = "Aave";
            yields[activeCount] = yieldData.aaveAPY;
            risks[activeCount] = _calculateRiskScore("Aave", yieldData.aaveAPY);
            activeCount++;
        }
        
        if (_isProtocolActive("Compound") && yieldData.compoundAPY > 0) {
            availableProtocols[activeCount] = "Compound";
            yields[activeCount] = yieldData.compoundAPY;
            risks[activeCount] = _calculateRiskScore("Compound", yieldData.compoundAPY);
            activeCount++;
        }
        
        if (_isProtocolActive("Yearn") && yieldData.yearnAPY > 0) {
            availableProtocols[activeCount] = "Yearn";
            yields[activeCount] = yieldData.yearnAPY;
            risks[activeCount] = _calculateRiskScore("Yearn", yieldData.yearnAPY);
            activeCount++;
        }
        
        if (_isProtocolActive("Curve") && yieldData.curveAPY > 0) {
            availableProtocols[activeCount] = "Curve";
            yields[activeCount] = yieldData.curveAPY;
            risks[activeCount] = _calculateRiskScore("Curve", yieldData.curveAPY);
            activeCount++;
        }

        require(activeCount >= riskParams.minDiversification, "Insufficient active protocols");

        // Resize arrays to actual count
        protocols = new string[](activeCount);
        allocations = new uint256[](activeCount);
        expectedAPYs = new uint256[](activeCount);

        for (uint256 i = 0; i < activeCount; i++) {
            protocols[i] = availableProtocols[i];
            expectedAPYs[i] = yields[i];
        }

        // Calculate optimal allocations using risk-adjusted yield optimization
        allocations = _calculateRiskAdjustedAllocations(yields, risks, activeCount);

        return (protocols, allocations, expectedAPYs);
    }

    /**
     * @notice Execute strategy update based on current market conditions
     * @return success Whether the strategy was successfully updated
     */
    function updateStrategy() external onlyRole(KEEPER_ROLE) returns (bool success) {
        require(address(functionsConsumer) != address(0), "Functions consumer not set");
        
        // Request fresh data from Functions Consumer
        functionsConsumer.requestYieldData();
        
        // Calculate new optimal allocation
        (
            string[] memory protocols,
            uint256[] memory allocations,
            uint256[] memory expectedAPYs
        ) = this.calculateOptimalAllocation(totalAssets);

        // Find the best single protocol for simplified strategy
        uint256 bestAPY = 0;
        string memory bestProtocol = "";
        uint256 bestRisk = 100;

        for (uint256 i = 0; i < protocols.length; i++) {
            uint256 riskAdjustedYield = (expectedAPYs[i] * (100 - _calculateRiskScore(protocols[i], expectedAPYs[i]))) / 100;
            if (riskAdjustedYield > bestAPY) {
                bestAPY = expectedAPYs[i];
                bestProtocol = protocols[i];
                bestRisk = _calculateRiskScore(protocols[i], expectedAPYs[i]);
            }
        }

        // Update current strategy
        currentStrategy = Strategy({
            protocolName: bestProtocol,
            allocation: 10000, // 100% for simplified strategy
            expectedAPY: bestAPY,
            riskScore: bestRisk,
            confidence: _calculateConfidence(bestAPY, bestRisk),
            timestamp: block.timestamp
        });

        // Store last allocation result
        lastAllocation = AllocationResult({
            protocols: protocols,
            allocations: allocations,
            expectedAPYs: expectedAPYs,
            totalExpectedAPY: _calculateWeightedAPY(allocations, expectedAPYs),
            riskScore: _calculatePortfolioRisk(allocations, protocols),
            timestamp: block.timestamp
        });

        emit StrategyUpdated(bestProtocol, 10000, bestAPY);
        emit AllocationCalculated(protocols, allocations, _calculateWeightedAPY(allocations, expectedAPYs));

        return true;
    }

    /**
     * @notice Execute rebalance if conditions are met
     * @return success Whether rebalance was executed
     */
    function executeRebalance() external onlyRole(KEEPER_ROLE) returns (bool success) {
        require(
            block.timestamp >= lastRebalance + rebalanceInterval,
            "Rebalance interval not met"
        );

        uint256 gasStart = gasleft();

        // Update strategy first
        updateStrategy();

        // Execute the rebalance (simplified for demo)
        lastRebalance = block.timestamp;
        
        uint256 gasUsed = gasStart - gasleft();
        emit RebalanceExecuted(totalAssets, currentStrategy.expectedAPY, gasUsed);

        return true;
    }

    /**
     * @notice Check if rebalance should be triggered
     * @return shouldRebalance Whether rebalance is needed
     * @return reason Human-readable reason
     */
    function checkUpkeep(bytes calldata) 
        external 
        view 
        returns (bool shouldRebalance, bytes memory reason) 
    {
        // Check time interval
        if (block.timestamp < lastRebalance + rebalanceInterval) {
            return (false, "Rebalance interval not met");
        }

        // Check if data is fresh
        if (address(functionsConsumer) == address(0) || !functionsConsumer.isDataFresh()) {
            return (false, "Yield data not fresh");
        }

        // Check if significant yield opportunity exists
        (string memory bestProtocol, uint256 bestAPY) = functionsConsumer.getBestYield(totalAssets);
        
        if (bestAPY > currentStrategy.expectedAPY + riskParams.rebalanceThreshold) {
            return (true, abi.encode("Better yield opportunity found", bestProtocol, bestAPY));
        }

        return (false, "No rebalance trigger met");
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @notice Add a new protocol
     * @param protocolAddress Protocol contract address
     * @param name Protocol name
     * @param weight Weight in basis points
     */
    function addProtocol(
        address protocolAddress,
        string memory name,
        uint256 weight
    ) external onlyRole(STRATEGIST_ROLE) {
        require(protocolAddress != address(0), "Invalid protocol address");
        require(weight <= 10000, "Weight exceeds 100%");

        protocols[protocolAddress] = Protocol({
            protocolAddress: protocolAddress,
            name: name,
            weight: weight,
            isActive: true,
            totalAllocated: 0,
            lastUpdate: block.timestamp
        });

        protocolsByName[name] = protocolAddress;
        protocolAddresses.push(protocolAddress);

        emit ProtocolAdded(protocolAddress, name, weight);
    }

    /**
     * @notice Update protocol configuration
     * @param protocolAddress Protocol to update
     * @param weight New weight
     * @param isActive Whether protocol is active
     */
    function updateProtocol(
        address protocolAddress,
        uint256 weight,
        bool isActive
    ) external onlyRole(STRATEGIST_ROLE) {
        Protocol storage protocol = protocols[protocolAddress];
        require(protocol.protocolAddress != address(0), "Protocol not found");

        protocol.weight = weight;
        protocol.isActive = isActive;
        protocol.lastUpdate = block.timestamp;

        emit ProtocolUpdated(protocolAddress, protocol.name, weight, isActive);
    }

    /**
     * @notice Set Functions Consumer contract
     * @param _functionsConsumer Address of Functions Consumer
     */
    function setFunctionsConsumer(address _functionsConsumer) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_functionsConsumer != address(0), "Invalid Functions Consumer");
        functionsConsumer = IYieldMaxFunctionsConsumer(_functionsConsumer);
        emit FunctionsConsumerUpdated(_functionsConsumer);
    }

    /**
     * @notice Update risk parameters
     * @param maxAllocationPerProtocol Maximum allocation per protocol (basis points)
     * @param minDiversification Minimum number of protocols
     * @param maxRiskScore Maximum acceptable risk score
     */
    function updateRiskParameters(
        uint256 maxAllocationPerProtocol,
        uint256 minDiversification,
        uint256 maxRiskScore
    ) external onlyRole(STRATEGIST_ROLE) {
        require(maxAllocationPerProtocol <= 10000, "Invalid max allocation");
        require(minDiversification >= 1, "Invalid min diversification");
        require(maxRiskScore <= 100, "Invalid max risk score");

        riskParams.maxAllocationPerProtocol = maxAllocationPerProtocol;
        riskParams.minDiversification = minDiversification;
        riskParams.maxRiskScore = maxRiskScore;

        emit RiskParametersUpdated(maxAllocationPerProtocol, minDiversification, maxRiskScore);
    }

    /**
     * @notice Update total assets (called by vault)
     * @param _totalAssets New total assets amount
     */
    function updateTotalAssets(uint256 _totalAssets) 
        external 
        onlyRole(VAULT_ROLE) 
    {
        totalAssets = _totalAssets;
    }

    // ==================== INTERNAL FUNCTIONS ====================

    /**
     * @notice Calculate risk-adjusted allocations
     * @param yields Array of protocol yields
     * @param risks Array of risk scores
     * @param count Number of active protocols
     * @return allocations Optimal allocation percentages
     */
    function _calculateRiskAdjustedAllocations(
        uint256[] memory yields,
        uint256[] memory risks,
        uint256 count
    ) internal view returns (uint256[] memory allocations) {
        allocations = new uint256[](count);
        uint256 totalWeight = 0;
        uint256[] memory weights = new uint256[](count);

        // Calculate risk-adjusted weights
        for (uint256 i = 0; i < count; i++) {
            // Risk-adjusted yield = yield * (100 - risk) / 100
            uint256 riskAdjustedYield = (yields[i] * (100 - risks[i])) / 100;
            weights[i] = riskAdjustedYield;
            totalWeight += riskAdjustedYield;
        }

        // Convert to allocations with max allocation constraint
        for (uint256 i = 0; i < count; i++) {
            if (totalWeight > 0) {
                uint256 allocation = (weights[i] * 10000) / totalWeight;
                // Apply max allocation constraint
                if (allocation > riskParams.maxAllocationPerProtocol) {
                    allocation = riskParams.maxAllocationPerProtocol;
                }
                allocations[i] = allocation;
            }
        }

        // Normalize to ensure total is 10000 (100%)
        _normalizeAllocations(allocations);

        return allocations;
    }

    /**
     * @notice Normalize allocations to sum to 10000 (100%)
     * @param allocations Array to normalize in-place
     */
    function _normalizeAllocations(uint256[] memory allocations) internal pure {
        uint256 total = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            total += allocations[i];
        }

        if (total != 10000 && total > 0) {
            // Adjust proportionally
            for (uint256 i = 0; i < allocations.length; i++) {
                allocations[i] = (allocations[i] * 10000) / total;
            }
        }
    }

    /**
     * @notice Calculate risk score for a protocol and APY
     * @param protocolName Name of the protocol
     * @param apy APY in basis points
     * @return riskScore Risk score from 0-100
     */
    function _calculateRiskScore(string memory protocolName, uint256 apy) 
        internal 
        pure 
        returns (uint256 riskScore) 
    {
        // Base risk scores for different protocols
        uint256 baseRisk;
        
        if (keccak256(bytes(protocolName)) == keccak256(bytes("Aave"))) {
            baseRisk = 10; // Lowest risk
        } else if (keccak256(bytes(protocolName)) == keccak256(bytes("Compound"))) {
            baseRisk = 15;
        } else if (keccak256(bytes(protocolName)) == keccak256(bytes("Yearn"))) {
            baseRisk = 25; // Higher risk, higher reward
        } else if (keccak256(bytes(protocolName)) == keccak256(bytes("Curve"))) {
            baseRisk = 20;
        } else {
            baseRisk = 30; // Unknown protocol = higher risk
        }

        // Adjust risk based on APY (higher APY might indicate higher risk)
        uint256 apyRisk = apy > 1000 ? (apy - 1000) / 100 : 0; // APY above 10% adds risk
        
        riskScore = baseRisk + apyRisk;
        if (riskScore > 100) riskScore = 100;
        
        return riskScore;
    }

    /**
     * @notice Calculate confidence score
     * @param apy Expected APY
     * @param riskScore Risk score
     * @return confidence Confidence from 0-100
     */
    function _calculateConfidence(uint256 apy, uint256 riskScore) 
        internal 
        pure 
        returns (uint256 confidence) 
    {
        // Higher APY with lower risk = higher confidence
        uint256 riskAdjustedAPY = (apy * (100 - riskScore)) / 100;
        
        // Confidence based on risk-adjusted APY
        if (riskAdjustedAPY > 800) {
            confidence = 95;
        } else if (riskAdjustedAPY > 600) {
            confidence = 85;
        } else if (riskAdjustedAPY > 400) {
            confidence = 75;
        } else if (riskAdjustedAPY > 200) {
            confidence = 65;
        } else {
            confidence = 50;
        }
        
        return confidence;
    }

    /**
     * @notice Calculate weighted average APY
     * @param allocations Array of allocations
     * @param apys Array of APYs
     * @return weightedAPY Weighted average APY
     */
    function _calculateWeightedAPY(
        uint256[] memory allocations,
        uint256[] memory apys
    ) internal pure returns (uint256 weightedAPY) {
        uint256 totalWeightedAPY = 0;
        uint256 totalAllocation = 0;

        for (uint256 i = 0; i < allocations.length; i++) {
            totalWeightedAPY += (allocations[i] * apys[i]);
            totalAllocation += allocations[i];
        }

        return totalAllocation > 0 ? totalWeightedAPY / totalAllocation : 0;
    }

    /**
     * @notice Calculate portfolio risk score
     * @param allocations Array of allocations
     * @param protocolNames Array of protocol names
     * @return portfolioRisk Overall portfolio risk score
     */
    function _calculatePortfolioRisk(
        uint256[] memory allocations,
        string[] memory protocolNames
    ) internal pure returns (uint256 portfolioRisk) {
        uint256 totalWeightedRisk = 0;
        uint256 totalAllocation = 0;

        for (uint256 i = 0; i < allocations.length; i++) {
            uint256 protocolRisk = _calculateRiskScore(protocolNames[i], 0); // Base risk only
            totalWeightedRisk += (allocations[i] * protocolRisk);
            totalAllocation += allocations[i];
        }

        return totalAllocation > 0 ? totalWeightedRisk / totalAllocation : 0;
    }

    /**
     * @notice Check if protocol is active
     * @param protocolName Name of the protocol
     * @return isActive Whether protocol is active
     */
    function _isProtocolActive(string memory protocolName) internal view returns (bool) {
        address protocolAddress = protocolsByName[protocolName];
        return protocolAddress != address(0) && protocols[protocolAddress].isActive;
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @notice Get current strategy
     * @return Current strategy struct
     */
    function getCurrentStrategy() external view returns (Strategy memory) {
        return currentStrategy;
    }

    /**
     * @notice Get last allocation result
     * @return Last allocation result struct
     */
    function getLastAllocation() external view returns (AllocationResult memory) {
        return lastAllocation;
    }

    /**
     * @notice Get all protocol addresses
     * @return Array of protocol addresses
     */
    function getAllProtocols() external view returns (address[] memory) {
        return protocolAddresses;
    }

    /**
     * @notice Get protocol by name
     * @param name Protocol name
     * @return Protocol struct
     */
    function getProtocolByName(string memory name) external view returns (Protocol memory) {
        address protocolAddress = protocolsByName[name];
        return protocols[protocolAddress];
    }

    /**
     * @notice Get risk parameters
     * @return Current risk parameters
     */
    function getRiskParameters() external view returns (RiskParameters memory) {
        return riskParams;
    }

    /**
     * @notice Get contract info for UI
     * @return Contract information
     */
    function getContractInfo() external view returns (
        address functionsConsumerAddress,
        uint256 totalAssetsManaged,
        uint256 lastRebalanceTime,
        uint256 protocolCount,
        bool isDataFresh
    ) {
        return (
            address(functionsConsumer),
            totalAssets,
            lastRebalance,
            protocolAddresses.length,
            address(functionsConsumer) != address(0) ? functionsConsumer.isDataFresh() : false
        );
    }
}