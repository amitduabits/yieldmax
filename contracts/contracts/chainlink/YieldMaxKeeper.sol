// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IYieldMaxVault {
    function lastRebalance() external view returns (uint256);
    function totalAssets() external view returns (uint256);
    function executeCrossChainRebalance(
        uint64 destinationChain,
        address destinationVault,
        uint256 amount,
        bytes calldata strategyData
    ) external;
}

contract YieldMaxKeeper is AutomationCompatibleInterface, Ownable {
    
    uint256 public interval = 1 hours; // Check every hour
    uint256 public minRebalanceThreshold = 24 hours; // Min 24h between rebalances
    uint256 public maxRebalancePercent = 1000; // Max 10% per rebalance
    
    mapping(address => bool) public registeredVaults;
    address[] public vaultList;
    
    event VaultRegistered(address indexed vault);
    event RebalanceTriggered(address indexed vault, uint256 amount);
    
    constructor() Ownable(msg.sender) {
        // Constructor now properly calls Ownable with initial owner
    }
    
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        for (uint256 i = 0; i < vaultList.length; i++) {
            address vault = vaultList[i];
            
            if (_shouldRebalance(vault)) {
                upkeepNeeded = true;
                performData = abi.encode(vault);
                break;
            }
        }
    }
    
    function performUpkeep(bytes calldata performData) external override {
        address vault = abi.decode(performData, (address));
        require(registeredVaults[vault], "Vault not registered");
        require(_shouldRebalance(vault), "Rebalance not needed");
        
        // Calculate rebalance amount (max 10% of total assets)
        uint256 totalAssets = IYieldMaxVault(vault).totalAssets();
        uint256 rebalanceAmount = (totalAssets * maxRebalancePercent) / 10000;
        
        // Example: rebalance to Arbitrum (in real implementation, use AI optimizer)
        uint64 arbitrumChainSelector = 3478487238524512106;
        address arbitrumVault = address(0); // Would be set during configuration
        
        try IYieldMaxVault(vault).executeCrossChainRebalance(
            arbitrumChainSelector,
            arbitrumVault,
            rebalanceAmount,
            ""
        ) {
            emit RebalanceTriggered(vault, rebalanceAmount);
        } catch {
            // Handle error - could emit an error event
        }
    }
    
    function _shouldRebalance(address vault) internal view returns (bool) {
        try IYieldMaxVault(vault).lastRebalance() returns (uint256 lastRebalance) {
            return (block.timestamp - lastRebalance) >= minRebalanceThreshold;
        } catch {
            return false;
        }
    }
    
    function registerVault(address vault) external onlyOwner {
        require(!registeredVaults[vault], "Vault already registered");
        registeredVaults[vault] = true;
        vaultList.push(vault);
        emit VaultRegistered(vault);
    }
    
    function removeVault(address vault) external onlyOwner {
        require(registeredVaults[vault], "Vault not registered");
        registeredVaults[vault] = false;
        
        // Remove from array
        for (uint256 i = 0; i < vaultList.length; i++) {
            if (vaultList[i] == vault) {
                vaultList[i] = vaultList[vaultList.length - 1];
                vaultList.pop();
                break;
            }
        }
    }
    
    function setInterval(uint256 _interval) external onlyOwner {
        interval = _interval;
    }
    
    function setMinRebalanceThreshold(uint256 _threshold) external onlyOwner {
        minRebalanceThreshold = _threshold;
    }
    
    function setMaxRebalancePercent(uint256 _percent) external onlyOwner {
        require(_percent <= 5000, "Max 50%"); // Safety limit
        maxRebalancePercent = _percent;
    }
    
    function getVaultCount() external view returns (uint256) {
        return vaultList.length;
    }
}