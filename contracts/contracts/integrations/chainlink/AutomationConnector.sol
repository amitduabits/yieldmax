// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
interface IYieldMaxVault {
    function rebalance() external;
}
interface IStrategyEngine {
    function shouldRebalance() external view returns (bool, string memory);
    function getCurrentStrategy() external view returns (
        string memory protocolName,
        uint256 allocation,
        uint256 expectedAPY,
        uint256 riskScore,
        uint256 confidence,
        uint256 timestamp
    );
}
contract AutomationConnector is AutomationCompatibleInterface, Ownable {
    IYieldMaxVault public immutable vault;
    IStrategyEngine public immutable strategyEngine;
    uint256 public lastCheck;
    uint256 public checkInterval = 1 hours;
    uint256 public consecutiveFailures;
    uint256 public totalUpkeeps;
    event UpkeepPerformed(uint256 timestamp, bool rebalanced);
    event CheckFailed(uint256 timestamp, string reason);
    constructor(address _vault, address _strategyEngine) {
        vault = IYieldMaxVault(_vault);
        strategyEngine = IStrategyEngine(_strategyEngine);
    }
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = _shouldPerformUpkeep();
        performData = "";
    }
    function performUpkeep(bytes calldata /* performData */) external override {
        require(_shouldPerformUpkeep(), "Upkeep not needed");
        lastCheck = block.timestamp;
        totalUpkeeps++;
        (bool shouldRebal, string memory reason) = strategyEngine.shouldRebalance();
        if (shouldRebal) {
            try vault.rebalance() {
                consecutiveFailures = 0;
                emit UpkeepPerformed(block.timestamp, true);
            } catch {
                consecutiveFailures++;
                emit CheckFailed(block.timestamp, "Rebalance failed");
            }
        } else {
            emit UpkeepPerformed(block.timestamp, false);
        }
    }
    function _shouldPerformUpkeep() private view returns (bool) {
        if (block.timestamp < lastCheck + checkInterval) {
            return false;
        }
        (bool shouldRebal, ) = strategyEngine.shouldRebalance();
        return shouldRebal;
    }
    function setCheckInterval(uint256 interval) external onlyOwner {
        require(interval >= 30 minutes, "Interval too short");
        checkInterval = interval;
    }
}