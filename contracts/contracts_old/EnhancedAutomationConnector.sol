// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IEnhancedVault {
    function checkAndRebalance() external returns (bool);
    function lastRebalanceTimestamp() external view returns (uint256);
    function rebalanceInterval() external view returns (uint256);
    function getCurrentAPY() external view returns (uint256);
    function totalAssets() external view returns (uint256);
}

/**
 * @title EnhancedAutomationConnector
 * @notice Chainlink Automation integration for YieldMax
 */
contract EnhancedAutomationConnector is AutomationCompatibleInterface, Ownable {
    IEnhancedVault public immutable vault;
    
    uint256 public lastCheckTimestamp;
    uint256 public checkInterval = 1 hours;
    uint256 public consecutiveFailures;
    uint256 public maxFailures = 5;
    
    // Performance tracking
    uint256 public totalRebalances;
    uint256 public totalGasUsed;
    
    event UpkeepPerformed(uint256 timestamp, bool rebalanced, uint256 gasUsed);
    event CheckFailed(uint256 timestamp, string reason);
    event ConfigUpdated(uint256 checkInterval, uint256 maxFailures);
    
    constructor(address _vault) {
        vault = IEnhancedVault(_vault);
    }
    
    /**
     * @notice Check if upkeep is needed
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = _shouldPerformUpkeep();
        performData = "";
        return (upkeepNeeded, performData);
    }
    
    /**
     * @notice Perform the upkeep
     */
    function performUpkeep(bytes calldata /* performData */) external override {
        uint256 gasStart = gasleft();
        
        if (!_shouldPerformUpkeep()) {
            revert("Upkeep not needed");
        }
        
        lastCheckTimestamp = block.timestamp;
        
        try vault.checkAndRebalance() returns (bool rebalanced) {
            consecutiveFailures = 0;
            totalRebalances++;
            
            uint256 gasUsed = gasStart - gasleft();
            totalGasUsed += gasUsed;
            
            emit UpkeepPerformed(block.timestamp, rebalanced, gasUsed);
        } catch Error(string memory reason) {
            consecutiveFailures++;
            emit CheckFailed(block.timestamp, reason);
        } catch {
            consecutiveFailures++;
            emit CheckFailed(block.timestamp, "Unknown error");
        }
    }
    
    /**
     * @notice Check if upkeep should be performed
     */
    function _shouldPerformUpkeep() private view returns (bool) {
        // Check if enough time has passed
        if (block.timestamp < lastCheckTimestamp + checkInterval) {
            return false;
        }
        
        // Check if we've had too many failures
        if (consecutiveFailures >= maxFailures) {
            return false;
        }
        
        // Check if vault needs rebalancing
        uint256 lastRebalance = vault.lastRebalanceTimestamp();
        uint256 rebalanceInterval = vault.rebalanceInterval();
        
        if (block.timestamp < lastRebalance + rebalanceInterval) {
            return false;
        }
        
        // Check if vault has assets to manage
        uint256 totalAssets = vault.totalAssets();
        if (totalAssets < 1000 * 1e6) { // Minimum $1000
            return false;
        }
        
        return true;
    }
    
    /**
     * @notice Get current system status
     */
    function getStatus() external view returns (
        bool isHealthy,
        uint256 currentAPY,
        uint256 totalManagedAssets,
        uint256 timeSinceLastCheck,
        uint256 failureCount
    ) {
        isHealthy = consecutiveFailures < maxFailures;
        currentAPY = vault.getCurrentAPY();
        totalManagedAssets = vault.totalAssets();
        timeSinceLastCheck = block.timestamp - lastCheckTimestamp;
        failureCount = consecutiveFailures;
    }
    
    /**
     * @notice Update automation configuration
     */
    function updateConfig(uint256 _checkInterval, uint256 _maxFailures) external onlyOwner {
        checkInterval = _checkInterval;
        maxFailures = _maxFailures;
        emit ConfigUpdated(_checkInterval, _maxFailures);
    }
    
    /**
     * @notice Reset failure counter
     */
    function resetFailures() external onlyOwner {
        consecutiveFailures = 0;
    }
    
    /**
     * @notice Emergency pause (disables automation)
     */
    function emergencyPause() external onlyOwner {
        consecutiveFailures = maxFailures;
    }
}