// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IYieldProtocol {
    function getAPY() external view returns (uint256);
    function getTVL() external view returns (uint256);
    function deposit(uint256 amount) external returns (uint256);
    function withdraw(uint256 shares) external returns (uint256);
}

interface IYieldMaxVault {
    function executeStrategy(address newProtocol, uint256 amount) external;
    function currentStrategy() external view returns (address);
    function totalAssets() external view returns (uint256);
}

contract ProductionStrategyEngine is AutomationCompatibleInterface, Ownable, ReentrancyGuard {
    // Chainlink Price Feed addresses on Sepolia
    AggregatorV3Interface public constant ETH_USD = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    AggregatorV3Interface public constant USDC_USD = AggregatorV3Interface(0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E);
    
    struct ProtocolData {
        string name;
        address protocolAddress;
        uint256 currentAPY;
        uint256 tvl;
        uint256 riskScore; // 0-100
        uint256 lastUpdate;
        bool isActive;
    }
    
    struct Strategy {
        string protocolName;
        address protocolAddress;
        uint256 allocation; // percentage in basis points (10000 = 100%)
        uint256 expectedAPY;
        uint256 riskScore;
        uint256 confidence; // 0-100
        uint256 timestamp;
    }
    
    // State variables
    mapping(address => ProtocolData) public protocols;
    address[] public protocolList;
    Strategy public currentStrategy;
    IYieldMaxVault public vault;
    
    // Yield data sources (would be Chainlink oracles in production)
    mapping(string => address) public yieldOracles;
    
    // Parameters
    uint256 public rebalanceThreshold = 50; // 0.5% APY difference triggers rebalance
    uint256 public maxRiskScore = 50; // Maximum acceptable risk
    uint256 public updateInterval = 3600; // 1 hour
    uint256 public lastUpdateTime;
    
    // Events
    event StrategyUpdated(string indexed protocol, uint256 apy, uint256 timestamp);
    event YieldDataUpdated(string indexed protocol, uint256 apy, uint256 tvl);
    event RebalanceTriggered(string from, string to, uint256 apyDifference);
    
    constructor(address _vault) {
        vault = IYieldMaxVault(_vault);
        _initializeProtocols();
    }
    
    function _initializeProtocols() private {
        // Initialize with real protocol addresses on Sepolia
        // These would be actual Aave, Compound, etc. deployment addresses
        _addProtocol(
            "Aave V3",
            0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951, // Aave V3 Pool Sepolia
            650, // 6.5% base APY
            20 // Low risk
        );
        
        _addProtocol(
            "Compound V3",
            0x9A539EEc489AAA03D588212a164d0abdB5F08F5F, // Compound V3 USDC Sepolia
            580, // 5.8% base APY
            25 // Low risk
        );
        
        // For demo - using mock addresses for Yearn and Curve
        _addProtocol(
            "Yearn Finance",
            address(0x3), // Would be real Yearn vault
            920, // 9.2% base APY
            40 // Medium risk
        );
        
        _addProtocol(
            "Curve 3Pool",
            address(0x4), // Would be real Curve pool
            480, // 4.8% base APY
            15 // Very low risk
        );
        
        // Set initial strategy
        currentStrategy = Strategy({
            protocolName: "Aave V3",
            protocolAddress: protocolList[0],
            allocation: 10000,
            expectedAPY: 650,
            riskScore: 20,
            confidence: 85,
            timestamp: block.timestamp
        });
    }
    
    function _addProtocol(
        string memory name,
        address protocolAddress,
        uint256 baseAPY,
        uint256 riskScore
    ) private {
        protocols[protocolAddress] = ProtocolData({
            name: name,
            protocolAddress: protocolAddress,
            currentAPY: baseAPY,
            tvl: 1000000 * 1e6, // Mock TVL
            riskScore: riskScore,
            lastUpdate: block.timestamp,
            isActive: true
        });
        protocolList.push(protocolAddress);
    }
    
    // Get real-time yield data using Chainlink oracles
    function updateYieldData() external nonReentrant {
        require(block.timestamp >= lastUpdateTime + updateInterval, "Too soon to update");
        
        for (uint i = 0; i < protocolList.length; i++) {
            address protocol = protocolList[i];
            ProtocolData storage data = protocols[protocol];
            
            if (data.isActive) {
                // In production, this would call Chainlink oracle for each protocol's APY
                uint256 newAPY = _fetchProtocolAPY(protocol);
                uint256 tvl = _fetchProtocolTVL(protocol);
                
                data.currentAPY = newAPY;
                data.tvl = tvl;
                data.lastUpdate = block.timestamp;
                
                emit YieldDataUpdated(data.name, newAPY, tvl);
            }
        }
        
        lastUpdateTime = block.timestamp;
        
        // Check if rebalance needed
        _evaluateStrategy();
    }
    
    function _fetchProtocolAPY(address protocol) private view returns (uint256) {
        // In production: Call Chainlink oracle or protocol's APY function
        // For now, simulate with some variation based on block timestamp
        ProtocolData memory data = protocols[protocol];
        uint256 baseAPY = data.currentAPY;
        
        // Add realistic market variation (±2%)
        uint256 variation = uint256(keccak256(abi.encodePacked(block.timestamp, protocol))) % 200;
        if (block.timestamp % 2 == 0) {
            return baseAPY + variation;
        } else {
            return baseAPY > variation ? baseAPY - variation : baseAPY;
        }
    }
    
    function _fetchProtocolTVL(address protocol) private view returns (uint256) {
        // In production: Get real TVL from protocol
        // Could integrate with DefiLlama API or protocol's own TVL function
        (, int256 ethPrice,,,) = ETH_USD.latestRoundData();
        uint256 baseTVL = protocols[protocol].tvl;
        
        // Simulate TVL changes based on ETH price movements
        return baseTVL * uint256(ethPrice) / 1e8;
    }
    
    function _evaluateStrategy() private {
        Strategy memory bestStrategy = currentStrategy;
        bool shouldRebalance = false;
        
        for (uint i = 0; i < protocolList.length; i++) {
            address protocol = protocolList[i];
            ProtocolData memory data = protocols[protocol];
            
            if (data.isActive && data.riskScore <= maxRiskScore) {
                // Calculate risk-adjusted APY
                uint256 riskAdjustedAPY = (data.currentAPY * (100 - data.riskScore)) / 100;
                uint256 currentRiskAdjustedAPY = (currentStrategy.expectedAPY * (100 - currentStrategy.riskScore)) / 100;
                
                // Check if this protocol offers significantly better yield
                if (riskAdjustedAPY > currentRiskAdjustedAPY + rebalanceThreshold) {
                    bestStrategy = Strategy({
                        protocolName: data.name,
                        protocolAddress: protocol,
                        allocation: 10000,
                        expectedAPY: data.currentAPY,
                        riskScore: data.riskScore,
                        confidence: _calculateConfidence(data),
                        timestamp: block.timestamp
                    });
                    shouldRebalance = true;
                }
            }
        }
        
        if (shouldRebalance) {
            emit RebalanceTriggered(
                currentStrategy.protocolName,
                bestStrategy.protocolName,
                bestStrategy.expectedAPY - currentStrategy.expectedAPY
            );
            currentStrategy = bestStrategy;
        }
    }
    
    function _calculateConfidence(ProtocolData memory data) private view returns (uint256) {
        // Confidence based on:
        // - TVL size (higher = more confidence)
        // - Data freshness
        // - Historical performance (would need more data)
        
        uint256 tvlScore = data.tvl > 10000000 * 1e6 ? 30 : data.tvl / (333333 * 1e6);
        uint256 freshnessScore = block.timestamp - data.lastUpdate < 3600 ? 30 : 15;
        uint256 riskScore = 40 - (data.riskScore * 40 / 100);
        
        return tvlScore + freshnessScore + riskScore;
    }
    
    // Chainlink Automation
    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = false;
        
        // Check if it's time to update yields
        if (block.timestamp >= lastUpdateTime + updateInterval) {
            upkeepNeeded = true;
            performData = abi.encode(0); // Update yields
            return (upkeepNeeded, performData);
        }
        
        // Check if current strategy is still optimal
        for (uint i = 0; i < protocolList.length; i++) {
            address protocol = protocolList[i];
            ProtocolData memory data = protocols[protocol];
            
            if (data.isActive && protocol != currentStrategy.protocolAddress) {
                uint256 apyDiff = data.currentAPY > currentStrategy.expectedAPY ? 
                    data.currentAPY - currentStrategy.expectedAPY : 0;
                    
                if (apyDiff > rebalanceThreshold && data.riskScore <= maxRiskScore) {
                    upkeepNeeded = true;
                    performData = abi.encode(1); // Rebalance needed
                    break;
                }
            }
        }
        
        return (upkeepNeeded, performData);
    }
    
    function performUpkeep(bytes calldata performData) external override {
        uint256 action = abi.decode(performData, (uint256));
        
        if (action == 0) {
            // Update yields
            this.updateYieldData();
        } else {
            // Execute rebalance
            _executeRebalance();
        }
    }
    
    function _executeRebalance() private {
        // In production: This would trigger actual fund movement
        vault.executeStrategy(currentStrategy.protocolAddress, vault.totalAssets());
        emit StrategyUpdated(
            currentStrategy.protocolName,
            currentStrategy.expectedAPY,
            block.timestamp
        );
    }
    
    // View functions
    function getCurrentStrategy() external view returns (
        string memory protocolName,
        uint256 allocation,
        uint256 expectedAPY,
        uint256 riskScore,
        uint256 confidence,
        uint256 timestamp
    ) {
        return (
            currentStrategy.protocolName,
            currentStrategy.allocation,
            currentStrategy.expectedAPY,
            currentStrategy.riskScore,
            currentStrategy.confidence,
            currentStrategy.timestamp
        );
    }
    
    function getCurrentYields() external view returns (
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY
    ) {
        // Return yields for standard protocols
        return (
            protocols[protocolList[0]].currentAPY,
            protocols[protocolList[1]].currentAPY,
            protocols[protocolList[2]].currentAPY,
            protocols[protocolList[3]].currentAPY
        );
    }
    
    function getBestYield(uint256 amount) external view returns (
        string memory protocol,
        uint256 expectedAPY
    ) {
        uint256 bestAPY = 0;
        string memory bestProtocol = "";
        
        for (uint i = 0; i < protocolList.length; i++) {
            ProtocolData memory data = protocols[protocolList[i]];
            if (data.isActive && data.riskScore <= maxRiskScore && data.currentAPY > bestAPY) {
                bestAPY = data.currentAPY;
                bestProtocol = data.name;
            }
        }
        
        return (bestProtocol, bestAPY);
    }
    
    function isDataFresh() external view returns (bool) {
        return block.timestamp - lastUpdateTime < updateInterval * 2;
    }
    
    // Admin functions
    function setRebalanceThreshold(uint256 _threshold) external onlyOwner {
        rebalanceThreshold = _threshold;
    }
    
    function setMaxRiskScore(uint256 _maxRisk) external onlyOwner {
        require(_maxRisk <= 100, "Invalid risk score");
        maxRiskScore = _maxRisk;
    }
    
    function addProtocol(
        string memory name,
        address protocolAddress,
        uint256 initialAPY,
        uint256 riskScore
    ) external onlyOwner {
        require(protocols[protocolAddress].protocolAddress == address(0), "Protocol exists");
        require(riskScore <= 100, "Invalid risk score");
        
        _addProtocol(name, protocolAddress, initialAPY, riskScore);
    }
    
    function setProtocolStatus(address protocol, bool active) external onlyOwner {
        protocols[protocol].isActive = active;
    }
}