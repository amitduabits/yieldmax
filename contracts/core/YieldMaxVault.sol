// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./interfaces/IStrategyEngine.sol";
import "./interfaces/IAIOptimizer.sol";

contract YieldMaxVault is ERC4626, AutomationCompatibleInterface {
    IStrategyEngine public strategyEngine;
    IAIOptimizer public aiOptimizer;
    
    uint256 public constant PERFORMANCE_FEE = 200; // 2%
    uint256 public constant MANAGEMENT_FEE = 50; // 0.5%
    uint256 public lastHarvestTime;
    uint256 public lastTotalAssets;
    
    mapping(address => uint256) public userProfits;
    mapping(address => bool) public premiumUsers;
    
    event YieldHarvested(uint256 profit, uint256 performanceFee);
    event AIRebalanceExecuted(string strategy, uint256 gasUsed);
    
    modifier onlyAI() {
        require(msg.sender == address(aiOptimizer), "Only AI");
        _;
    }
    
    function deposit(uint256 assets, address receiver) 
        public 
        override 
        returns (uint256) 
    {
        // AI analyzes best entry strategy
        IAIOptimizer.Strategy memory strategy = aiOptimizer.getDepositStrategy(
            assets,
            receiver,
            premiumUsers[receiver]
        );
        
        // Execute optimized deposit
        if (strategy.shouldSplit) {
            return _executeOptimizedDeposit(assets, receiver, strategy);
        }
        
        return super.deposit(assets, receiver);
    }
    
    function _executeOptimizedDeposit(
        uint256 assets,
        address receiver,
        IAIOptimizer.Strategy memory strategy
    ) internal returns (uint256) {
        // Split deposits across protocols based on AI recommendation
        uint256 totalShares;
        
        for (uint i = 0; i < strategy.protocols.length; i++) {
            uint256 amount = (assets * strategy.allocations[i]) / 10000;
            strategyEngine.deployToProtocol(
                strategy.protocols[i],
                strategy.chains[i],
                amount
            );
        }
        
        return _mint(receiver, _convertToShares(assets, Math.Rounding.Down));
    }
    
    // Chainlink Automation
    function checkUpkeep(bytes calldata checkData)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // Check if AI recommends rebalancing
        bool shouldRebalance = aiOptimizer.shouldRebalance();
        bool shouldHarvest = block.timestamp > lastHarvestTime + 1 hours;
        
        upkeepNeeded = shouldRebalance || shouldHarvest;
        performData = abi.encode(shouldRebalance, shouldHarvest);
    }
    
    function performUpkeep(bytes calldata performData) external override {
        (bool shouldRebalance, bool shouldHarvest) = abi.decode(
            performData,
            (bool, bool)
        );
        
        if (shouldRebalance) {
            _executeAIRebalance();
        }
        
        if (shouldHarvest) {
            _harvestYield();
        }
    }
    
    function _executeAIRebalance() internal {
        uint256 gasStart = gasleft();
        
        IAIOptimizer.RebalanceAction[] memory actions = aiOptimizer
            .getRebalanceActions();
            
        for (uint i = 0; i < actions.length; i++) {
            strategyEngine.executeRebalance(actions[i]);
        }
        
        emit AIRebalanceExecuted(
            "AI_OPTIMIZED",
            gasStart - gasleft()
        );
    }
}