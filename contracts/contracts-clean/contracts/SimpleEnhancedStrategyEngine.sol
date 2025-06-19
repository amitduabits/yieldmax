// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleEnhancedStrategyEngine
 * @notice Simplified yield optimization engine without stack depth issues
 * @dev Production-ready strategy engine that can be enhanced with Chainlink later
 */
contract SimpleEnhancedStrategyEngine is AccessControl, ReentrancyGuard {
    
    // ==================== ROLES ====================
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    // ==================== STRUCTS ====================
    struct Protocol {
        address protocolAddress;
        string name;
        uint256 currentAPY; // Current APY in basis points
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

    struct YieldData {
        uint256 aaveAPY;
        uint256 compoundAPY;
        uint256 yearnAPY;
        uint256 curveAPY;
        uint256 lastUpdate;
        bool isValid;
    }

    // ==================== STATE VARIABLES ====================
    mapping(address => Protocol) public protocols;
    mapping(string => address) public protocolsByName;
    address[] public protocolAddresses;
    
    Strategy public currentStrategy;
    YieldData public currentYields;
    
    uint256 public totalAssets;
    uint256 public lastRebalance;
    uint256 public rebalanceInterval = 3600; // 1 hour

    // ==================== EVENTS ====================
    event ProtocolAdded(address indexed protocolAddress, string name, uint256 weight);
    event ProtocolUpdated(address indexed protocolAddress, string name, uint256 apy, bool isActive);
    event StrategyUpdated(string protocolName, uint256 allocation, uint256 expectedAPY);
    event YieldsUpdated(uint256 aaveAPY, uint256 compoundAPY, uint256 yearnAPY, uint256 curveAPY);
    event RebalanceExecuted(uint256 totalAssets, uint256 newAPY, uint256 gasUsed);

    // ==================== CONSTRUCTOR ====================
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);

        // Initialize with demo data
        _initializeDemoData();
    }

    // ==================== MAIN FUNCTIONS ====================

    /**
     * @notice Update yield data manually (simulates Chainlink Functions)
     */
    function updateYieldData(
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY
    ) external onlyRole(KEEPER_ROLE) {
        currentYields.aaveAPY = aaveAPY;
        currentYields.compoundAPY = compoundAPY;
        currentYields.yearnAPY = yearnAPY;
        currentYields.curveAPY = curveAPY;
        currentYields.lastUpdate = block.timestamp;
        currentYields.isValid = true;

        // Update protocol APYs
        _updateProtocolAPYs(aaveAPY, compoundAPY, yearnAPY, curveAPY);

        emit YieldsUpdated(aaveAPY, compoundAPY, yearnAPY, curveAPY);
    }

    /**
     * @notice Get the best yield opportunity
     */
    function getBestYield(uint256) external view returns (string memory protocol, uint256 expectedAPY) {
        require(currentYields.isValid, "No valid yield data");
        
        return _findBestProtocol();
    }

    /**
     * @notice Update strategy based on current yields
     */
    function updateStrategy() external onlyRole(KEEPER_ROLE) returns (bool success) {
        require(currentYields.isValid, "No valid yield data");

        (string memory bestProtocol, uint256 bestAPY) = _findBestProtocol();
        require(bytes(bestProtocol).length > 0, "No active protocols");

        uint256 riskScore = _calculateRiskScore(bestProtocol, bestAPY);
        uint256 confidence = _calculateConfidence(bestAPY, riskScore);

        currentStrategy.protocolName = bestProtocol;
        currentStrategy.allocation = 10000;
        currentStrategy.expectedAPY = bestAPY;
        currentStrategy.riskScore = riskScore;
        currentStrategy.confidence = confidence;
        currentStrategy.timestamp = block.timestamp;

        emit StrategyUpdated(bestProtocol, 10000, bestAPY);
        return true;
    }

    /**
     * @notice Execute rebalance if conditions are met
     */
    function executeRebalance() external onlyRole(KEEPER_ROLE) returns (bool success) {
        require(block.timestamp >= lastRebalance + rebalanceInterval, "Rebalance interval not met");

        uint256 gasStart = gasleft();
        this.updateStrategy();
        lastRebalance = block.timestamp;
        
        uint256 gasUsed = gasStart - gasleft();
        emit RebalanceExecuted(totalAssets, currentStrategy.expectedAPY, gasUsed);

        return true;
    }

    /**
     * @notice Check if rebalance should be triggered
     */
    function checkUpkeep(bytes calldata) 
        external 
        view 
        returns (bool shouldRebalance, bytes memory reason) 
    {
        if (block.timestamp < lastRebalance + rebalanceInterval) {
            return (false, "Rebalance interval not met");
        }

        if (!currentYields.isValid || (block.timestamp - currentYields.lastUpdate) > 7200) {
            return (false, "Yield data not fresh");
        }

        (string memory bestProtocol, uint256 bestAPY) = _findBestProtocol();
        
        if (bestAPY > currentStrategy.expectedAPY + 200) {
            return (true, abi.encode("Better yield opportunity found", bestProtocol, bestAPY));
        }

        return (false, "No rebalance trigger met");
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @notice Add a new protocol
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
            currentAPY: 0,
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
     */
    function updateProtocol(
        address protocolAddress,
        uint256 apy,
        bool isActive
    ) external onlyRole(STRATEGIST_ROLE) {
        Protocol storage protocol = protocols[protocolAddress];
        require(protocol.protocolAddress != address(0), "Protocol not found");

        protocol.currentAPY = apy;
        protocol.isActive = isActive;
        protocol.lastUpdate = block.timestamp;

        emit ProtocolUpdated(protocolAddress, protocol.name, apy, isActive);
    }

    /**
     * @notice Update total assets (called by vault)
     */
    function updateTotalAssets(uint256 _totalAssets) external onlyRole(VAULT_ROLE) {
        totalAssets = _totalAssets;
    }

    /**
     * @notice Demo function to simulate yield updates
     */
    function requestYieldUpdate() external onlyRole(KEEPER_ROLE) {
        uint256 aaveAPY = 702;
        uint256 compoundAPY = 626;
        uint256 yearnAPY = 995;
        uint256 curveAPY = 519;

        if (block.timestamp % 3 == 0) {
            yearnAPY = 1250;
        }

        this.updateYieldData(aaveAPY, compoundAPY, yearnAPY, curveAPY);
    }

    // ==================== INTERNAL FUNCTIONS ====================

    function _initializeDemoData() internal {
        currentYields = YieldData({
            aaveAPY: 702,
            compoundAPY: 626,
            yearnAPY: 995,
            curveAPY: 519,
            lastUpdate: block.timestamp,
            isValid: true
        });

        currentStrategy = Strategy({
            protocolName: "Yearn",
            allocation: 10000,
            expectedAPY: 995,
            riskScore: 25,
            confidence: 85,
            timestamp: block.timestamp
        });
    }

    function _updateProtocolAPYs(
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY
    ) internal {
        address aaveAddr = protocolsByName["Aave"];
        if (aaveAddr != address(0)) {
            protocols[aaveAddr].currentAPY = aaveAPY;
        }
        
        address compoundAddr = protocolsByName["Compound"];
        if (compoundAddr != address(0)) {
            protocols[compoundAddr].currentAPY = compoundAPY;
        }
        
        address yearnAddr = protocolsByName["Yearn"];
        if (yearnAddr != address(0)) {
            protocols[yearnAddr].currentAPY = yearnAPY;
        }
        
        address curveAddr = protocolsByName["Curve"];
        if (curveAddr != address(0)) {
            protocols[curveAddr].currentAPY = curveAPY;
        }
    }

    function _findBestProtocol() internal view returns (string memory protocol, uint256 expectedAPY) {
        uint256 bestAPY = 0;
        string memory bestProtocol = "";

        address aaveAddr = protocolsByName["Aave"];
        if (aaveAddr != address(0) && protocols[aaveAddr].isActive && currentYields.aaveAPY > bestAPY) {
            bestAPY = currentYields.aaveAPY;
            bestProtocol = "Aave";
        }
        
        address compoundAddr = protocolsByName["Compound"];
        if (compoundAddr != address(0) && protocols[compoundAddr].isActive && currentYields.compoundAPY > bestAPY) {
            bestAPY = currentYields.compoundAPY;
            bestProtocol = "Compound";
        }
        
        address yearnAddr = protocolsByName["Yearn"];
        if (yearnAddr != address(0) && protocols[yearnAddr].isActive && currentYields.yearnAPY > bestAPY) {
            bestAPY = currentYields.yearnAPY;
            bestProtocol = "Yearn";
        }
        
        address curveAddr = protocolsByName["Curve"];
        if (curveAddr != address(0) && protocols[curveAddr].isActive && currentYields.curveAPY > bestAPY) {
            bestAPY = currentYields.curveAPY;
            bestProtocol = "Curve";
        }

        return (bestProtocol, bestAPY);
    }

    function _calculateRiskScore(string memory protocolName, uint256 apy) 
        internal 
        pure 
        returns (uint256 riskScore) 
    {
        uint256 baseRisk;
        bytes32 nameHash = keccak256(bytes(protocolName));
        
        if (nameHash == keccak256(bytes("Aave"))) {
            baseRisk = 10;
        } else if (nameHash == keccak256(bytes("Compound"))) {
            baseRisk = 15;
        } else if (nameHash == keccak256(bytes("Yearn"))) {
            baseRisk = 25;
        } else if (nameHash == keccak256(bytes("Curve"))) {
            baseRisk = 20;
        } else {
            baseRisk = 30;
        }

        uint256 apyRisk = apy > 1000 ? (apy - 1000) / 100 : 0;
        riskScore = baseRisk + apyRisk;
        if (riskScore > 100) riskScore = 100;
        
        return riskScore;
    }

    function _calculateConfidence(uint256 apy, uint256 riskScore) 
        internal 
        pure 
        returns (uint256 confidence) 
    {
        uint256 riskAdjustedAPY = (apy * (100 - riskScore)) / 100;
        
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

    // ==================== VIEW FUNCTIONS ====================

    function getCurrentStrategy() external view returns (Strategy memory) {
        return currentStrategy;
    }

    function getCurrentYields() external view returns (YieldData memory) {
        return currentYields;
    }

    function getAllProtocols() external view returns (address[] memory) {
        return protocolAddresses;
    }

    function getProtocolByName(string memory name) external view returns (Protocol memory) {
        address protocolAddress = protocolsByName[name];
        return protocols[protocolAddress];
    }

    function isDataFresh() external view returns (bool) {
        return currentYields.isValid && (block.timestamp - currentYields.lastUpdate) <= 3600;
    }

    function getContractInfo() external view returns (
        uint256 totalAssetsManaged,
        uint256 lastRebalanceTime,
        uint256 protocolCount,
        bool dataFreshness
    ) {
        return (
            totalAssets,
            lastRebalance,
            protocolAddresses.length,
            currentYields.isValid && (block.timestamp - currentYields.lastUpdate) <= 3600
        );
    }
}