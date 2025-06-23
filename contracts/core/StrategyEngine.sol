// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StrategyEngine is Ownable, ReentrancyGuard {
    // Protocol definitions
    enum Protocol { NONE, AAVE, COMPOUND, YEARN, CURVE }
    
    struct Strategy {
        string protocolName;
        uint256 allocation; // Percentage in basis points (10000 = 100%)
        uint256 expectedAPY; // APY in basis points
        uint256 riskScore; // 0-100, lower is safer
        uint256 confidence; // 0-100, higher is more confident
        uint256 timestamp;
    }
    
    struct ProtocolData {
        uint256 apy;
        uint256 tvl;
        uint256 utilization;
        uint256 lastUpdate;
        bool active;
    }
    
    // State variables
    Strategy public currentStrategy;
    mapping(Protocol => ProtocolData) public protocolData;
    mapping(address => bool) public authorizedVaults;
    
    uint256 public rebalanceThreshold = 50; // 0.5% in basis points
    uint256 public lastRebalance;
    uint256 public totalRebalances;
    
    // Events
    event StrategyUpdated(Protocol indexed protocol, uint256 apy, uint256 allocation);
    event RebalanceExecuted(Protocol from, Protocol to, uint256 timestamp);
    event ProtocolDataUpdated(Protocol indexed protocol, uint256 apy, uint256 tvl);
    
    constructor() {
        // Initialize with default strategy
        currentStrategy = Strategy({
            protocolName: "Aave",
            allocation: 10000,
            expectedAPY: 520, // 5.2%
            riskScore: 20,
            confidence: 85,
            timestamp: block.timestamp
        });
        
        _initializeProtocols();
    }
    
    function _initializeProtocols() private {
        // Initialize protocol data with realistic values
        protocolData[Protocol.AAVE] = ProtocolData({
            apy: 520, // 5.2%
            tvl: 5000000000, // $5B
            utilization: 7500, // 75%
            lastUpdate: block.timestamp,
            active: true
        });
        
        protocolData[Protocol.COMPOUND] = ProtocolData({
            apy: 485, // 4.85%
            tvl: 3000000000, // $3B
            utilization: 6800, // 68%
            lastUpdate: block.timestamp,
            active: true
        });
        
        protocolData[Protocol.YEARN] = ProtocolData({
            apy: 750, // 7.5%
            tvl: 1000000000, // $1B
            utilization: 8200, // 82%
            lastUpdate: block.timestamp,
            active: true
        });
        
        protocolData[Protocol.CURVE] = ProtocolData({
            apy: 425, // 4.25%
            tvl: 4000000000, // $4B
            utilization: 5500, // 55%
            lastUpdate: block.timestamp,
            active: true
        });
    }
    
    function executeRebalance() external onlyAuthorizedVault returns (bool) {
        Protocol bestProtocol = _findBestProtocol();
        Protocol currentProtocol = _getProtocolFromName(currentStrategy.protocolName);
        
        if (bestProtocol == currentProtocol) {
            return false;
        }
        
        // Update strategy
        currentStrategy = Strategy({
            protocolName: _getProtocolName(bestProtocol),
            allocation: 10000,
            expectedAPY: protocolData[bestProtocol].apy,
            riskScore: _calculateRiskScore(bestProtocol),
            confidence: _calculateConfidence(bestProtocol),
            timestamp: block.timestamp
        });
        
        lastRebalance = block.timestamp;
        totalRebalances++;
        
        emit RebalanceExecuted(currentProtocol, bestProtocol, block.timestamp);
        emit StrategyUpdated(bestProtocol, protocolData[bestProtocol].apy, 10000);
        
        return true;
    }
    
    function shouldRebalance() external view returns (bool, string memory) {
        Protocol bestProtocol = _findBestProtocol();
        Protocol currentProtocol = _getProtocolFromName(currentStrategy.protocolName);
        
        if (bestProtocol == currentProtocol) {
            return (false, "Current protocol is optimal");
        }
        
        uint256 currentAPY = protocolData[currentProtocol].apy;
        uint256 bestAPY = protocolData[bestProtocol].apy;
        
        if (bestAPY <= currentAPY) {
            return (false, "No better yield available");
        }
        
        uint256 improvement = ((bestAPY - currentAPY) * 10000) / currentAPY;
        
        if (improvement < rebalanceThreshold) {
            return (false, "Improvement below threshold");
        }
        
        return (true, "Rebalance recommended");
    }
    
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
    
    function updateProtocolData(Protocol protocol, uint256 apy, uint256 tvl) external onlyOwner {
        require(protocol != Protocol.NONE, "Invalid protocol");
        
        protocolData[protocol].apy = apy;
        protocolData[protocol].tvl = tvl;
        protocolData[protocol].lastUpdate = block.timestamp;
        
        emit ProtocolDataUpdated(protocol, apy, tvl);
    }
    
    function _findBestProtocol() private view returns (Protocol) {
        Protocol bestProtocol = Protocol.AAVE;
        uint256 bestScore = 0;
        
        for (uint256 i = 1; i <= uint256(Protocol.CURVE); i++) {
            Protocol protocol = Protocol(i);
            if (!protocolData[protocol].active) continue;
            
            uint256 score = _calculateProtocolScore(protocol);
            if (score > bestScore) {
                bestScore = score;
                bestProtocol = protocol;
            }
        }
        
        return bestProtocol;
    }
    
    function _calculateProtocolScore(Protocol protocol) private view returns (uint256) {
        ProtocolData memory data = protocolData[protocol];
        
        // Score = 70% APY + 20% TVL + 10% (100 - utilization)
        uint256 apyScore = (data.apy * 70) / 100;
        uint256 tvlScore = (data.tvl / 100000000 * 20) / 100; // Normalize TVL
        uint256 utilizationScore = ((10000 - data.utilization) * 10) / 10000;
        
        return apyScore + tvlScore + utilizationScore;
    }
    
    function _calculateRiskScore(Protocol protocol) private view returns (uint256) {
        ProtocolData memory data = protocolData[protocol];
        
        // Higher utilization = higher risk
        uint256 utilizationRisk = (data.utilization * 40) / 10000;
        
        // Lower TVL = higher risk
        uint256 tvlRisk = data.tvl < 1000000000 ? 30 : 10;
        
        // Protocol-specific risk
        uint256 protocolRisk = 20;
        if (protocol == Protocol.YEARN) protocolRisk = 35;
        
        return utilizationRisk + tvlRisk + protocolRisk;
    }
    
    function _calculateConfidence(Protocol protocol) private view returns (uint256) {
        ProtocolData memory data = protocolData[protocol];
        
        // Confidence based on data freshness and TVL
        uint256 dataAge = block.timestamp - data.lastUpdate;
        uint256 freshness = dataAge < 1 hours ? 90 : dataAge < 1 days ? 70 : 50;
        
        uint256 tvlConfidence = data.tvl > 2000000000 ? 90 : 70;
        
        return (freshness + tvlConfidence) / 2;
    }
    
    function _getProtocolFromName(string memory name) private pure returns (Protocol) {
        if (keccak256(bytes(name)) == keccak256(bytes("Aave"))) return Protocol.AAVE;
        if (keccak256(bytes(name)) == keccak256(bytes("Compound"))) return Protocol.COMPOUND;
        if (keccak256(bytes(name)) == keccak256(bytes("Yearn"))) return Protocol.YEARN;
        if (keccak256(bytes(name)) == keccak256(bytes("Curve"))) return Protocol.CURVE;
        return Protocol.NONE;
    }
    
    function _getProtocolName(Protocol protocol) private pure returns (string memory) {
        if (protocol == Protocol.AAVE) return "Aave";
        if (protocol == Protocol.COMPOUND) return "Compound";
        if (protocol == Protocol.YEARN) return "Yearn";
        if (protocol == Protocol.CURVE) return "Curve";
        return "None";
    }
    
    // Admin functions
    function authorizeVault(address vault) external onlyOwner {
        authorizedVaults[vault] = true;
    }
    
    function setRebalanceThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 1000, "Threshold too high"); // Max 10%
        rebalanceThreshold = threshold;
    }
    
    modifier onlyAuthorizedVault() {
        require(authorizedVaults[msg.sender], "Not authorized");
        _;
    }
}