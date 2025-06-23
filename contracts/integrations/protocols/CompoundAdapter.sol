// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ProtocolAdapters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICompoundV3 {
    function supply(address asset, uint256 amount) external;
    function withdraw(address asset, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

contract CompoundAdapter is BaseProtocolAdapter {
    ICompoundV3 public immutable compoundV3;
    
    constructor(address _vault, address _compoundV3) BaseProtocolAdapter(_vault) {
        compoundV3 = ICompoundV3(_compoundV3);
    }
    
    function deposit(address asset, uint256 amount) external override onlyVault returns (uint256) {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(asset).safeApprove(address(compoundV3), amount);
        
        uint256 balanceBefore = compoundV3.balanceOf(address(this));
        compoundV3.supply(asset, amount);
        uint256 balanceAfter = compoundV3.balanceOf(address(this));
        
        return balanceAfter - balanceBefore;
    }
    
    function withdraw(address asset, uint256 amount) external override onlyVault returns (uint256) {
        compoundV3.withdraw(asset, amount);
        IERC20(asset).safeTransfer(msg.sender, amount);
        return amount;
    }
    
    function getBalance(address asset, address user) public view override returns (uint256) {
        return compoundV3.balanceOf(user);
    }
    
    function getCurrentAPY() external pure override returns (uint256) {
        return 485; // 4.85%
    }
    
    function getProtocolName() external pure override returns (string memory) {
        return "Compound";
    }
}