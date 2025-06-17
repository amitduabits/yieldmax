// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IYieldMaxVault {
    function lastRebalance() external view returns (uint256);
    function totalAssets() external view returns (uint256);
    function totalShares() external view returns (uint256);
    
    function deposit(uint256 amount, address receiver) external returns (uint256 shares);
    function requestWithdraw(uint256 shares) external returns (uint256 requestId);
    function completeWithdraw(uint256 requestId) external returns (uint256 amount);
    
    function executeCrossChainRebalance(
        uint64 destinationChain,
        address destinationVault,
        uint256 amount,
        bytes calldata strategyData
    ) external;
    
    function triggerRebalance() external;
    
    function setSupportedChain(uint64 chainSelector, bool supported) external;
    function pause() external;
    function unpause() external;
}