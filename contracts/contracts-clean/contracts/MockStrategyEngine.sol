// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockStrategyEngine {
    struct Strategy {
        string protocolName;
        uint256 allocation;
        uint256 expectedAPY;
        uint256 riskScore;
        uint256 confidence;
        uint256 timestamp;
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
            "Yearn Finance",
            100,
            925, // 9.25%
            35,
            92,
            block.timestamp
        );
    }
    
    function getCurrentYields() external pure returns (
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY
    ) {
        return (652, 582, 925, 483); // 6.52%, 5.82%, 9.25%, 4.83%
    }
    
    function getBestYield(uint256) external pure returns (
        string memory protocol,
        uint256 expectedAPY
    ) {
        return ("Yearn Finance", 925);
    }
    
    function checkUpkeep(bytes calldata) external pure returns (
        bool upkeepNeeded,
        bytes memory performData
    ) {
        return (true, "");
    }
    
    function isDataFresh() external pure returns (bool) {
        return true;
    }
    
    function updateStrategy() external {
        // Mock function - does nothing but won't revert
    }
    
    function performUpkeep(bytes calldata) external {
        // Mock function - does nothing but won't revert
    }
}

contract MockOracleManager {
    uint256 public lastUpdate;
    
    function getLatestYieldData() external view returns (
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY,
        uint256 lastUpdateTime
    ) {
        return (652, 582, 925, 483, block.timestamp);
    }
    
    function updateYieldData() external {
        lastUpdate = block.timestamp;
        // In a real implementation, this would fetch from Chainlink oracles
    }
    
    function isDataFresh() external pure returns (bool) {
        return true;
    }
}

contract MockAutomationManager {
    uint256 public totalRebalances = 0;
    
    event RebalanceExecuted(uint256 timestamp, string from, string to);
    
    function getAutomationStatus() external view returns (
        bool needsUpkeep,
        uint256 nextRebalanceTime,
        uint256 totalRebalancesCount,
        address currentProtocol,
        uint256 currentAPY
    ) {
        return (
            true,
            block.timestamp + 3600,
            totalRebalances,
            address(0),
            774 // 7.74%
        );
    }
    
    function checkUpkeep(bytes calldata) external pure returns (
        bool upkeepNeeded,
        bytes memory performData
    ) {
        return (true, "");
    }
    
    function performUpkeep(bytes calldata) external {
        totalRebalances++;
        emit RebalanceExecuted(block.timestamp, "Aave", "Yearn");
    }
    
    function getRebalanceHistory(uint256) external pure returns (
        RebalanceEvent[] memory
    ) {
        RebalanceEvent[] memory empty;
        return empty;
    }
    
    struct RebalanceEvent {
        uint256 timestamp;
        address fromProtocol;
        address toProtocol;
        uint256 amount;
        uint256 reason;
    }
}