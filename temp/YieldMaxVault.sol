// contracts/YieldMaxVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YieldMaxVault is Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable asset;
    uint256 public totalAssets;
    uint256 public totalShares;
    
    mapping(address => uint256) public balanceOf;
    
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed sender, address indexed receiver, uint256 assets, uint256 shares);
    
    constructor(address _asset) {
        require(_asset != address(0), "Invalid asset");
        asset = IERC20(_asset);
    }
    
    function deposit(uint256 assets, address receiver) public returns (uint256 shares) {
        require(assets > 0, "Zero assets");
        require(receiver != address(0), "Invalid receiver");
        
        // Transfer assets from sender
        asset.safeTransferFrom(msg.sender, address(this), assets);
        
        // Calculate shares
        if (totalShares == 0) {
            shares = assets;
        } else {
            shares = (assets * totalShares) / totalAssets;
        }
        
        // Update state
        totalAssets += assets;
        totalShares += shares;
        balanceOf[receiver] += shares;
        
        emit Deposit(msg.sender, receiver, assets, shares);
    }
    
    function withdraw(uint256 shares, address receiver) public returns (uint256 assets) {
        require(shares > 0, "Zero shares");
        require(receiver != address(0), "Invalid receiver");
        require(balanceOf[msg.sender] >= shares, "Insufficient balance");
        
        // Calculate assets
        assets = (shares * totalAssets) / totalShares;
        
        // Update state
        balanceOf[msg.sender] -= shares;
        totalShares -= shares;
        totalAssets -= assets;
        
        // Transfer assets
        asset.safeTransfer(receiver, assets);
        
        emit Withdraw(msg.sender, receiver, assets, shares);
    }
}