// contracts/AutomationVaultConnector.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVault {
    function executeStrategy() external;
}

interface IStrategyEngine {
    function checkUpkeep(bytes calldata) external view returns (bool, bytes memory);
}

contract AutomationVaultConnector {
    address public vault;
    address public strategyEngine;
    address public owner;
    uint256 public lastExecutionTime;
    uint256 public executionInterval = 3600; // 1 hour
    
    event StrategyExecuted(uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _vault, address _strategyEngine) {
        vault = _vault;
        strategyEngine = _strategyEngine;
        owner = msg.sender;
        lastExecutionTime = block.timestamp;
    }
    
    // Chainlink Automation compatible
    function checkUpkeep(bytes calldata) external view returns (
        bool upkeepNeeded,
        bytes memory performData
    ) {
        // Check if enough time has passed
        upkeepNeeded = (block.timestamp - lastExecutionTime) >= executionInterval;
        
        // Also check if strategy engine says rebalance is needed
        if (!upkeepNeeded) {
            (bool needsRebalance,) = IStrategyEngine(strategyEngine).checkUpkeep("");
            upkeepNeeded = needsRebalance;
        }
        
        return (upkeepNeeded, "");
    }
    
    function performUpkeep(bytes calldata) external {
        // Execute strategy on vault
        IVault(vault).executeStrategy();
        lastExecutionTime = block.timestamp;
        
        emit StrategyExecuted(block.timestamp);
    }
    
    // Admin functions
    function updateVault(address _vault) external onlyOwner {
        vault = _vault;
    }
    
    function updateInterval(uint256 _interval) external onlyOwner {
        executionInterval = _interval;
    }
}