// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DynamicMockStrategyEngine {
    struct Strategy {
        string protocolName;
        uint256 allocation;
        uint256 expectedAPY;
        uint256 riskScore;
        uint256 confidence;
        uint256 timestamp;
    }
    
    // State variables to make data dynamic
    uint256 private seed = 1;
    string public currentProtocol = "Aave V3";
    
    function getCurrentStrategy() external view returns (
        string memory protocolName,
        uint256 allocation,
        uint256 expectedAPY,
        uint256 riskScore,
        uint256 confidence,
        uint256 timestamp
    ) {
        // Return current protocol which can change after rebalance
        return (
            currentProtocol,
            100,
            _getCurrentProtocolAPY(),
            35,
            92,
            block.timestamp
        );
    }
    
    function getCurrentYields() external view returns (
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY
    ) {
        // Add small random variations based on block timestamp
        uint256 variation = (block.timestamp % 50); // 0-49 basis points
        
        return (
            650 + variation,           // Aave: 6.50-6.99%
            580 + (variation * 2) / 3, // Compound: 5.80-6.13%
            920 + variation,           // Yearn: 9.20-9.69%
            480 + variation / 2        // Curve: 4.80-5.04%
        );
    }
    
    function _getCurrentProtocolAPY() private view returns (uint256) {
        if (keccak256(bytes(currentProtocol)) == keccak256(bytes("Aave V3"))) {
            return 650 + (block.timestamp % 50);
        } else if (keccak256(bytes(currentProtocol)) == keccak256(bytes("Yearn Finance"))) {
            return 920 + (block.timestamp % 50);
        }
        return 700; // Default
    }
    
    function getBestYield(uint256) external view returns (
        string memory protocol,
        uint256 expectedAPY
    ) {
        // Always recommend Yearn as best
        return ("Yearn Finance", 920 + (block.timestamp % 50));
    }
    
    function checkUpkeep(bytes calldata) external view returns (
        bool upkeepNeeded,
        bytes memory performData
    ) {
        // Need rebalance if not on Yearn
        bool needsRebalance = keccak256(bytes(currentProtocol)) != keccak256(bytes("Yearn Finance"));
        return (needsRebalance, "");
    }
    
    function isDataFresh() external pure returns (bool) {
        return true;
    }
    
    function updateStrategy() external {
        seed = seed + 1;
    }
    
    function performUpkeep(bytes calldata) external {
        // Switch to Yearn when rebalancing
        currentProtocol = "Yearn Finance";
    }
}

contract DynamicMockOracleManager {
    uint256 public lastUpdate;
    uint256 private nonce = 0;
    
    function getLatestYieldData() external view returns (
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY,
        uint256 lastUpdateTime
    ) {
        // Dynamic yields that change slightly each block
        uint256 variation = (block.timestamp + nonce) % 30;
        
        return (
            652 + variation,      // Aave: 6.52-6.82%
            582 + variation / 2,  // Compound: 5.82-5.97%
            925 + variation,      // Yearn: 9.25-9.55%
            483 + variation / 3,  // Curve: 4.83-4.93%
            block.timestamp
        );
    }
    
    function updateYieldData() external {
        lastUpdate = block.timestamp;
        nonce = nonce + 1; // Change data slightly
    }
    
    function isDataFresh() external view returns (bool) {
        return (block.timestamp - lastUpdate) < 3600; // Fresh if updated within 1 hour
    }
}

contract DynamicMockAutomationManager {
    uint256 public totalRebalances = 0;
    string public lastFromProtocol = "Aave V3";
    string public lastToProtocol = "Yearn Finance";
    
    event RebalanceExecuted(uint256 timestamp, string from, string to);
    
    function getAutomationStatus() external view returns (
        bool needsUpkeep,
        uint256 nextRebalanceTime,
        uint256 totalRebalancesCount,
        address currentProtocol,
        uint256 currentAPY
    ) {
        // After first rebalance, don't need another immediately
        bool needsRebalance = totalRebalances == 0 || ((block.timestamp % 7200) < 3600);
        uint256 apy = totalRebalances == 0 ? 774 : 925; // 7.74% initially, 9.25% after rebalance
        
        return (
            needsRebalance,
            block.timestamp + 3600,
            totalRebalances,
            address(0),
            apy
        );
    }
    
    function checkUpkeep(bytes calldata) external view returns (
        bool upkeepNeeded,
        bytes memory performData
    ) {
        bool needsRebalance = totalRebalances == 0 || ((block.timestamp % 7200) < 3600);
        return (needsRebalance, "");
    }
    
    function performUpkeep(bytes calldata) external {
        totalRebalances++;
        
        // Alternate between protocols for demo
        if (totalRebalances % 2 == 1) {
            lastFromProtocol = "Aave V3";
            lastToProtocol = "Yearn Finance";
        } else {
            lastFromProtocol = "Yearn Finance";
            lastToProtocol = "Compound V3";
        }
        
        emit RebalanceExecuted(block.timestamp, lastFromProtocol, lastToProtocol);
    }
    
    function getRebalanceHistory(uint256 limit) external view returns (
        RebalanceEvent[] memory events
    ) {
        if (totalRebalances == 0) {
            return new RebalanceEvent[](0);
        }
        
        // Return mock history based on totalRebalances
        uint256 count = totalRebalances < limit ? totalRebalances : limit;
        events = new RebalanceEvent[](count);
        
        for (uint256 i = 0; i < count; i++) {
            events[i] = RebalanceEvent({
                timestamp: block.timestamp - (i * 3600), // 1 hour apart
                fromProtocol: i % 2 == 0 ? address(0x1) : address(0x2),
                toProtocol: i % 2 == 0 ? address(0x2) : address(0x3),
                amount: 1000000 * (i + 1), // Increasing amounts
                reason: i % 3 // Rotate through reasons
            });
        }
        
        return events;
    }
    
    struct RebalanceEvent {
        uint256 timestamp;
        address fromProtocol;
        address toProtocol;
        uint256 amount;
        uint256 reason;
    }
}