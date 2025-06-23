// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ProtocolAdapters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IYearnVault {
    function deposit(uint256 amount) external returns (uint256);
    function withdraw(uint256 maxShares) external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function pricePerShare() external view returns (uint256);
}

contract YearnAdapter is BaseProtocolAdapter {
    mapping(address => address) public yearnVaults;
    
    constructor(address _vault) BaseProtocolAdapter(_vault) {}
    
    function deposit(address asset, uint256 amount) external override onlyVault returns (uint256) {
        address yVault = yearnVaults[asset];
        require(yVault != address(0), "Vault not set");
        
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(asset).safeApprove(yVault, amount);
        
        uint256 shares = IYearnVault(yVault).deposit(amount);
        return shares;
    }
    
    function withdraw(address asset, uint256 shares) external override onlyVault returns (uint256) {
        address yVault = yearnVaults[asset];
        require(yVault != address(0), "Vault not set");
        
        uint256 amount = IYearnVault(yVault).withdraw(shares);
        IERC20(asset).safeTransfer(msg.sender, amount);
        return amount;
    }
    
    function getBalance(address asset, address user) public view override returns (uint256) {
        address yVault = yearnVaults[asset];
        if (yVault == address(0)) return 0;
        
        uint256 shares = IYearnVault(yVault).balanceOf(user);
        uint256 pricePerShare = IYearnVault(yVault).pricePerShare();
        return (shares * pricePerShare) / 1e18;
    }
    
    function getCurrentAPY() external pure override returns (uint256) {
        return 750; // 7.5%
    }
    
    function getProtocolName() external pure override returns (string memory) {
        return "Yearn";
    }
    
    function setYearnVault(address asset, address yVault) external {
        require(msg.sender == vault, "Only vault");
        yearnVaults[asset] = yVault;
    }
}