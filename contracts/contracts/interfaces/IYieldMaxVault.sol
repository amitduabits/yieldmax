// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IYieldMaxVault {
    function deposit(uint256 amount, address receiver) external returns (uint256 shares);
    function withdraw(uint256 shares, address receiver) external returns (uint256 assets);
    function totalAssets() external view returns (uint256);
    function totalShares() external view returns (uint256);
    function userData(address user) external view returns (uint256 shares, uint256 pendingWithdraw);
}
