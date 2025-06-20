// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Mock contract for testing without actual CCIP
contract MockCrossChainYieldManager {
    mapping(uint64 => ChainData) public chainYieldData;
    CrossChainRebalance[] public rebalanceHistory;
    uint256 public totalCrossChainVolume;
    uint256 public totalRebalances;
    
    struct ChainData {
        uint256 bestAPY;
        string bestProtocol;
        uint256 tvl;
        uint256 lastUpdate;
        bool isActive;
    }
    
    struct CrossChainRebalance {
        uint64 fromChain;
        uint64 toChain;
        uint256 amount;
        uint256 expectedAPY;
        uint256 timestamp;
        address user;
    }
    
    event CrossChainRebalanceInitiated(
        address indexed user,
        uint64 fromChain,
        uint64 toChain,
        uint256 amount,
        uint256 expectedAPY
    );
    
    constructor() {
        _initializeChainData();
    }
    
    function _initializeChainData() private {
        // Ethereum
        chainYieldData[1] = ChainData({
            bestAPY: 925,
            bestProtocol: "Yearn Finance",
            tvl: 5500 * 1e6,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        // Arbitrum
        chainYieldData[2] = ChainData({
            bestAPY: 1142,
            bestProtocol: "GMX",
            tvl: 320 * 1e6,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        // Polygon
        chainYieldData[3] = ChainData({
            bestAPY: 873,
            bestProtocol: "Aave V3",
            tvl: 1200 * 1e6,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        // Optimism
        chainYieldData[4] = ChainData({
            bestAPY: 1015,
            bestProtocol: "Velodrome",
            tvl: 180 * 1e6,
            lastUpdate: block.timestamp,
            isActive: true
        });
    }
    
    function getChainComparison() external view returns (
        ChainData memory ethereum,
        ChainData memory arbitrum,
        ChainData memory polygon,
        ChainData memory optimism
    ) {
        return (
            chainYieldData[1],
            chainYieldData[2],
            chainYieldData[3],
            chainYieldData[4]
        );
    }
    
    function initiateCrossChainRebalance(
        uint64 destinationChain,
        address, // token parameter (unused in mock)
        uint256 amount
    ) external returns (bytes32) {
        // Mock implementation
        rebalanceHistory.push(CrossChainRebalance({
            fromChain: 1, // Ethereum
            toChain: destinationChain,
            amount: amount,
            expectedAPY: chainYieldData[destinationChain].bestAPY,
            timestamp: block.timestamp,
            user: msg.sender
        }));
        
        totalRebalances++;
        totalCrossChainVolume += amount;
        
        emit CrossChainRebalanceInitiated(
            msg.sender,
            1,
            destinationChain,
            amount,
            chainYieldData[destinationChain].bestAPY
        );
        
        return keccak256(abi.encodePacked(block.timestamp, msg.sender));
    }
    
    function updateYieldData() external {
        // Simulate yield changes
        uint256 variation = block.timestamp % 50;
        
        chainYieldData[1].bestAPY = 925 + variation;
        chainYieldData[2].bestAPY = 1142 - variation / 2;
        chainYieldData[3].bestAPY = 873 + variation / 3;
        chainYieldData[4].bestAPY = 1015 + variation / 4;
        
        for (uint64 i = 1; i <= 4; i++) {
            chainYieldData[i].lastUpdate = block.timestamp;
        }
    }
    
    function getRebalanceHistory(uint256 limit) external view returns (
        CrossChainRebalance[] memory
    ) {
        uint256 count = rebalanceHistory.length < limit ? rebalanceHistory.length : limit;
        CrossChainRebalance[] memory recent = new CrossChainRebalance[](count);
        
        for (uint256 i = 0; i < count; i++) {
            recent[i] = rebalanceHistory[rebalanceHistory.length - 1 - i];
        }
        
        return recent;
    }
}