// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IProtocolAdapter {
    function deposit(address asset, uint256 amount) external returns (uint256 shares);
    function withdraw(address asset, uint256 shares) external returns (uint256 amount);
    function getBalance(address asset, address user) external view returns (uint256);
    function getCurrentAPY() external view returns (uint256);
    function getProtocolName() external pure returns (string memory);
}

abstract contract BaseProtocolAdapter is IProtocolAdapter {
    using SafeERC20 for IERC20;
    
    modifier onlyVault() {
        require(msg.sender == vault, "Only vault");
        _;
    }
    
    address public immutable vault;
    
    constructor(address _vault) {
        vault = _vault;
    }
}