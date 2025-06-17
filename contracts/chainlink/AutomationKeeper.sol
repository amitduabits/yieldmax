// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YieldMaxKeeper is AutomationCompatibleInterface, Ownable {
    struct VaultConfig {
        address vault;
        uint256 minRebalanceInterval;
        uint256 minYieldDifference; // basis points
        uint256 lastCheck;
        bool isActive;
    }
    
    mapping(address => VaultConfig) public vaultConfigs;
    address[] public vaults;
    
    IStrategyEngine public strategyEngine;
    IAIOptimizer public aiOptimizer;
    
    event RebalanceTriggered(address indexed vault, uint256 timestamp);
    event VaultAdded(address indexed vault);
    
    constructor(address _strategyEngine, address _aiOptimizer) {
        strategyEngine = IStrategyEngine(_strategyEngine);
        aiOptimizer = IAIOptimizer(_aiOptimizer);
    }
    
    function checkUpkeep(bytes calldata checkData)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        address[] memory vaultsToRebalance = new address[](vaults.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < vaults.length; i++) {
            VaultConfig memory config = vaultConfigs[vaults[i]];
            
            if (!config.isActive) continue;
            
            // Check time interval
            if (block.timestamp < config.lastCheck + config.minRebalanceInterval) {
                continue;
            }
            
            // Check yield difference
            uint256 currentYield = IYieldMaxVault(config.vault).getCurrentYield();
            uint256 optimalYield = aiOptimizer.getOptimalYield(config.vault);
            
            if (optimalYield > currentYield + config.minYieldDifference) {
                vaultsToRebalance[count] = vaults[i];
                count++;
            }
        }
        
        if (count > 0) {
            // Resize array
            assembly {
                mstore(vaultsToRebalance, count)
            }
            upkeepNeeded = true;
            performData = abi.encode(vaultsToRebalance);
        }
    }
    
    function performUpkeep(bytes calldata performData) external override {
        address[] memory vaultsToRebalance = abi.decode(performData, (address[]));
        
        for (uint256 i = 0; i < vaultsToRebalance.length; i++) {
            address vault = vaultsToRebalance[i];
            VaultConfig storage config = vaultConfigs[vault];
            
            // Double-check conditions
            if (block.timestamp < config.lastCheck + config.minRebalanceInterval) {
                continue;
            }
            
            // Execute rebalance
            try IYieldMaxVault(vault).executeRebalance() {
                config.lastCheck = block.timestamp;
                emit RebalanceTriggered(vault, block.timestamp);
            } catch {
                // Log error but continue with other vaults
            }
        }
    }
    
    function addVault(
        address vault,
        uint256 minRebalanceInterval,
        uint256 minYieldDifference
    ) external onlyOwner {
        require(vault != address(0), "Invalid vault");
        require(!vaultConfigs[vault].isActive, "Vault already added");
        
        vaultConfigs[vault] = VaultConfig({
            vault: vault,
            minRebalanceInterval: minRebalanceInterval,
            minYieldDifference: minYieldDifference,
            lastCheck: block.timestamp,
            isActive: true
        });
        
        vaults.push(vault);
        emit VaultAdded(vault);
    }
}