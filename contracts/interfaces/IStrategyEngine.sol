// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IStrategyEngine {
    struct Strategy {
        string protocolName;
        uint256 allocation;
        uint256 expectedAPY;
        uint256 riskScore;
        uint256 confidence;
        uint256 timestamp;
    }
    
    function executeRebalance() external returns (bool);
    function getCurrentStrategy() external view returns (
        string memory protocolName,
        uint256 allocation,
        uint256 expectedAPY,
        uint256 riskScore,
        uint256 confidence,
        uint256 timestamp
    );
    function shouldRebalance() external view returns (bool, string memory);
    function updateProtocolData(uint256 protocol, uint256 apy, uint256 tvl) external;
}