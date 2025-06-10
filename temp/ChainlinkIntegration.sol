// contracts/ChainlinkIntegration.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IYieldMaxVault.sol";
import "./interfaces/IStrategyEngine.sol";

contract ChainlinkIntegration is AutomationCompatibleInterface, Ownable {
    IYieldMaxVault public immutable vault;
    IStrategyEngine public immutable strategy;
    
    uint256 public lastRebalanceTime;
    uint256 public rebalanceInterval = 4 hours;
    
    event RebalanceTriggered(uint256 timestamp);
    
    constructor(
        address _vault,
        address _strategy,
        address _functionsRouter
    ) {
        vault = IYieldMaxVault(_vault);
        strategy = IStrategyEngine(_strategy);
    }
    
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = (block.timestamp - lastRebalanceTime) >= rebalanceInterval;
        performData = "";
    }
    
    function performUpkeep(bytes calldata) external override {
        require(
            (block.timestamp - lastRebalanceTime) >= rebalanceInterval,
            "Too early"
        );
        
        lastRebalanceTime = block.timestamp;
        
        // Trigger rebalancing
        bytes memory instructions = abi.encode(new IYieldMaxVault.RebalanceInstruction[](0));
        vault.rebalance(instructions);
        
        emit RebalanceTriggered(block.timestamp);
    }
    
    function setRebalanceInterval(uint256 _interval) external onlyOwner {
        rebalanceInterval = _interval;
    }
}