// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IYieldMaxVault {
    function totalAssets() external view returns (uint256);
    function totalShares() external view returns (uint256);
}

interface ISimpleEnhancedStrategyEngine {
    function updateTotalAssets(uint256 _totalAssets) external;
    function getCurrentStrategy() external view returns (
        string memory protocolName,
        uint256 allocation,
        uint256 expectedAPY,
        uint256 riskScore,
        uint256 confidence,
        uint256 timestamp
    );
    function getBestYield(uint256 amount) external view returns (string memory protocol, uint256 expectedAPY);
    function checkUpkeep(bytes calldata) external view returns (bool shouldRebalance, bytes memory reason);
    function updateStrategy() external returns (bool success);
}

/**
 * @title VaultStrategyAdapter
 * @notice Adapter contract to connect YieldMax Vault with Enhanced Strategy Engine
 * @dev Provides easy interface for vault-strategy integration
 */
contract VaultStrategyAdapter is Ownable {
    
    IYieldMaxVault public immutable vault;
    ISimpleEnhancedStrategyEngine public immutable strategyEngine;
    
    uint256 public lastSync;
    uint256 public lastStrategyUpdate;
    
    event VaultSynced(uint256 totalAssets, uint256 timestamp);
    event StrategyRecommendation(string protocol, uint256 expectedAPY, uint256 riskScore);
    event RebalanceRecommended(string reason);
    
    constructor(address _vault, address _strategyEngine) Ownable(msg.sender) {
        vault = IYieldMaxVault(_vault);
        strategyEngine = ISimpleEnhancedStrategyEngine(_strategyEngine);
    }
    
    /**
     * @notice Sync vault assets with strategy engine
     */
    function syncVaultAssets() external {
        uint256 totalAssets = vault.totalAssets();
        strategyEngine.updateTotalAssets(totalAssets);
        lastSync = block.timestamp;
        
        emit VaultSynced(totalAssets, block.timestamp);
    }
    
    /**
     * @notice Get current strategy recommendation
     */
    function getStrategyRecommendation() external view returns (
        string memory protocol,
        uint256 expectedAPY,
        uint256 riskScore,
        uint256 confidence
    ) {
        (
            string memory protocolName,
            ,
            uint256 apy,
            uint256 risk,
            uint256 conf,
        ) = strategyEngine.getCurrentStrategy();
        
        return (protocolName, apy, risk, conf);
    }
    
    /**
     * @notice Check if rebalance is recommended
     */
    function shouldRebalance() external view returns (bool, string memory) {
        (bool should, bytes memory reasonBytes) = strategyEngine.checkUpkeep("");
        string memory reason = string(reasonBytes);
        return (should, reason);
    }
    
    /**
     * @notice Update strategy if needed
     */
    function updateStrategyIfNeeded() external onlyOwner returns (bool updated) {
        (bool should,) = strategyEngine.checkUpkeep("");
        
        if (should) {
            bool success = strategyEngine.updateStrategy();
            if (success) {
                lastStrategyUpdate = block.timestamp;
                
                // Get new strategy for event
                (
                    string memory protocol,
                    ,
                    uint256 expectedAPY,
                    uint256 riskScore,
                    ,
                ) = strategyEngine.getCurrentStrategy();
                
                emit StrategyRecommendation(protocol, expectedAPY, riskScore);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @notice Get comprehensive vault and strategy status
     */
    function getStatus() external view returns (
        uint256 vaultAssets,
        uint256 vaultShares,
        string memory currentProtocol,
        uint256 currentAPY,
        uint256 riskScore,
        bool rebalanceNeeded,
        uint256 lastSyncTime
    ) {
        vaultAssets = vault.totalAssets();
        vaultShares = vault.totalShares();
        
        (
            currentProtocol,
            ,
            currentAPY,
            riskScore,
            ,
        ) = strategyEngine.getCurrentStrategy();
        
        (rebalanceNeeded,) = strategyEngine.checkUpkeep("");
        lastSyncTime = lastSync;
    }
    
    /**
     * @notice Force strategy update (owner only)
     */
    function forceStrategyUpdate() external onlyOwner returns (bool) {
        bool success = strategyEngine.updateStrategy();
        if (success) {
            lastStrategyUpdate = block.timestamp;
        }
        return success;
    }
}