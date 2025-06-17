// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Minimal ERC20 interface
interface IERC20Minimal {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

// Ultra minimal YieldMax Vault
contract YieldMaxVault {
    address public owner;
    IERC20Minimal public asset;
    
    uint256 public totalAssets;
    uint256 public totalShares;
    uint256 public lastRebalance;
    
    mapping(address => uint256) public userShares;
    mapping(address => uint256) public userLastDeposit;
    mapping(uint64 => bool) public supportedChains;
    
    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 amount, uint256 shares);
    event CrossChainRebalance(uint64 destChain, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _asset) {
        owner = msg.sender;
        asset = IERC20Minimal(_asset);
        lastRebalance = block.timestamp;
    }
    
    function deposit(uint256 amount, address receiver) external returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");
        require(receiver != address(0), "Invalid receiver");
        
        // Calculate shares
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalAssets;
        }
        
        // Transfer assets
        require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update state
        totalAssets += amount;
        totalShares += shares;
        userShares[receiver] += shares;
        userLastDeposit[receiver] = block.timestamp;
        
        emit Deposit(receiver, amount, shares);
    }
    
    function withdraw(uint256 shares) external returns (uint256 amount) {
        require(shares > 0, "Shares must be greater than 0");
        require(userShares[msg.sender] >= shares, "Insufficient shares");
        
        // Calculate amount
        amount = (shares * totalAssets) / totalShares;
        
        // Update state
        userShares[msg.sender] -= shares;
        totalShares -= shares;
        totalAssets -= amount;
        
        // Transfer assets
        require(asset.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdraw(msg.sender, amount, shares);
    }
    
    function setSupportedChain(uint64 chainSelector, bool supported) external onlyOwner {
        supportedChains[chainSelector] = supported;
    }
    
    function triggerRebalance() external onlyOwner {
        lastRebalance = block.timestamp;
        emit CrossChainRebalance(421614, 0); // Example: Arbitrum
    }
    
    // View functions
    function getUserShares(address user) external view returns (uint256) {
        return userShares[user];
    }
    
    function calculateShares(uint256 amount) external view returns (uint256) {
        if (totalShares == 0) {
            return amount;
        }
        return (amount * totalShares) / totalAssets;
    }
    
    function calculateAssets(uint256 shares) external view returns (uint256) {
        if (totalShares == 0) {
            return 0;
        }
        return (shares * totalAssets) / totalShares;
    }
}