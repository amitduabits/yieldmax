// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IProtocolAdapter {
    function deposit(address asset, uint256 amount) external returns (uint256 shares);
    function withdraw(address asset, uint256 shares) external returns (uint256 amount);
    function getBalance(address asset, address user) external view returns (uint256);
    function getCurrentAPY() external view returns (uint256);
    function getProtocolName() external pure returns (string memory);
}