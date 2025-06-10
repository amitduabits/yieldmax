// contracts/YieldMaxVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YieldMaxVault is Ownable {
    using SafeERC20 for IERC20;
    
    // Events
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed sender, address indexed receiver, uint256 assets, uint256 shares);
    
    // State variables
    IERC20 public immutable asset;
    uint256 public totalAssets;
    uint256 public totalShares;
    mapping(address => uint256) public balanceOf;
    
    // Keeper for automation
    address public keeper;
    
    modifier onlyKeeperOrOwner() {
        require(msg.sender == keeper || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(address _asset) {
        require(_asset != address(0), "Zero address");
        asset = IERC20(_asset);
        keeper = msg.sender;
    }
    
    function deposit(uint256 assets, address receiver) public returns (uint256 shares) {
        require(assets > 0, "Zero assets");
        require(receiver != address(0), "Zero receiver");
        
        // Need to deposit before minting shares
        asset.safeTransferFrom(msg.sender, address(this), assets);
        
        // Calculate shares to mint
        if (totalShares == 0) {
            shares = assets;
        } else {
            shares = (assets * totalShares) / totalAssets;
        }
        
        // Mint shares
        balanceOf[receiver] += shares;
        totalShares += shares;
        totalAssets += assets;
        
        emit Deposit(msg.sender, receiver, assets, shares);
    }
    
    function withdraw(uint256 shares, address receiver) public returns (uint256 assets) {
        require(shares > 0, "Zero shares");
        require(receiver != address(0), "Zero receiver");
        require(balanceOf[msg.sender] >= shares, "Insufficient balance");
        
        // Calculate assets to withdraw
        assets = (shares * totalAssets) / totalShares;
        
        // Burn shares
        balanceOf[msg.sender] -= shares;
        totalShares -= shares;
        totalAssets -= assets;
        
        // Transfer assets
        asset.safeTransfer(receiver, assets);
        
        emit Withdraw(msg.sender, receiver, assets, shares);
    }
    
    // Admin functions
    function setKeeper(address _keeper) external onlyOwner {
        require(_keeper != address(0), "Zero address");
        keeper = _keeper;
    }
    
    // View functions
    function convertToShares(uint256 assets) public view returns (uint256) {
        if (totalAssets == 0) return assets;
        return (assets * totalShares) / totalAssets;
    }
    
    function convertToAssets(uint256 shares) public view returns (uint256) {
        if (totalShares == 0) return shares;
        return (shares * totalAssets) / totalShares;
    }
}