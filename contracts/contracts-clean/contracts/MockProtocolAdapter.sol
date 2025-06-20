// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockProtocolAdapter {
    mapping(address => uint256) public balances;
    
    function deposit(address asset, uint256 amount) external returns (uint256) {
        balances[asset] += amount;
        return amount;
    }
    
    function withdraw(address asset, uint256 amount) external returns (uint256) {
        balances[asset] -= amount;
        return amount;
    }
    
    function getBalance(address asset) external view returns (uint256) {
        return balances[asset];
    }
    
    function getCurrentAPY() external pure returns (uint256) {
        return 850; // 8.5% APY
    }
}