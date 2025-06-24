// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IStrategyEngine {
    function executeRebalance() external returns (bool);
    function getCurrentStrategy() external view returns (
        string memory protocolName,
        uint256 allocation,
        uint256 expectedAPY,
        uint256 riskScore,
        uint256 confidence,
        uint256 timestamp
    );
    function shouldRebalance() external view returns (bool, string memory reason);
}

contract YieldMaxVault is ERC20, ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    
    // Roles
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    
    // Core components
    IERC20 public immutable asset;
    IStrategyEngine public strategyEngine;
    
    // Security limits
    uint256 public maxWithdrawalPerTx = 100000 * 10**6; // 100k USDC
    uint256 public strategyChangeDelay = 6 hours;
    uint256 public lastStrategyChange;
    
    // Vault state
    uint256 public totalAssets;
    uint256 public lastRebalance;
    mapping(address => uint256) public userShares;
    
    // Events
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed sender, address indexed receiver, uint256 assets, uint256 shares);
    event Rebalanced(string newProtocol, uint256 newAPY, uint256 timestamp);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    constructor(
        address _asset,
        address _strategyEngine,
        address _keeper
    ) ERC20("YieldMax USDC Vault", "ymUSDC") {
        asset = IERC20(_asset);
        strategyEngine = IStrategyEngine(_strategyEngine);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, _keeper);
        _grantRole(STRATEGIST_ROLE, msg.sender);
    }
    
    // Main vault functions
    function deposit(uint256 assets, address receiver) public nonReentrant whenNotPaused returns (uint256 shares) {
        require(assets > 0, "Zero deposit");
        require(receiver != address(0), "Invalid receiver");
        
        // Calculate shares
        shares = previewDeposit(assets);
        require(shares > 0, "Zero shares");
        
        // Transfer assets from sender
        asset.safeTransferFrom(msg.sender, address(this), assets);
        
        // Mint shares
        _mint(receiver, shares);
        totalAssets += assets;
        userShares[receiver] += shares;
        
        emit Deposit(msg.sender, receiver, assets, shares);
    }
    
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public nonReentrant returns (uint256 shares) {
        require(assets > 0, "Zero withdrawal");
        require(assets <= maxWithdrawalPerTx, "Exceeds max withdrawal");
        require(receiver != address(0), "Invalid receiver");
        
        shares = previewWithdraw(assets);
        require(shares > 0, "Zero shares");
        
        if (msg.sender != owner) {
            uint256 allowed = allowance(owner, msg.sender);
            if (allowed != type(uint256).max) {
                require(allowed >= shares, "Insufficient allowance");
                _approve(owner, msg.sender, allowed - shares);
            }
        }
        
        // Burn shares
        _burn(owner, shares);
        totalAssets -= assets;
        userShares[owner] -= shares;
        
        // Transfer assets
        asset.safeTransfer(receiver, assets);
        
        emit Withdraw(msg.sender, receiver, assets, shares);
    }
    
    // Rebalancing function
    function rebalance() external onlyRole(KEEPER_ROLE) {
        require(block.timestamp >= lastStrategyChange + strategyChangeDelay, "Too soon");
        
        (bool shouldRebal, string memory reason) = strategyEngine.shouldRebalance();
        require(shouldRebal, reason);
        
        bool success = strategyEngine.executeRebalance();
        require(success, "Rebalance failed");
        
        lastRebalance = block.timestamp;
        lastStrategyChange = block.timestamp;
        
        (string memory protocol, , uint256 apy, , , ) = strategyEngine.getCurrentStrategy();
        emit Rebalanced(protocol, apy, block.timestamp);
    }
    
    // View functions
    function previewDeposit(uint256 assets) public view returns (uint256) {
        return convertToShares(assets);
    }
    
    function previewWithdraw(uint256 assets) public view returns (uint256) {
        return convertToShares(assets);
    }
    
    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? assets : assets * supply / totalAssets;
    }
    
    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? shares : shares * totalAssets / supply;
    }
    
    function maxDeposit(address) public pure returns (uint256) {
        return type(uint256).max;
    }
    
    function maxWithdraw(address owner) public view returns (uint256) {
        return convertToAssets(balanceOf(owner));
    }
    
    // Emergency functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    function emergencyWithdraw() external nonReentrant {
        uint256 shares = balanceOf(msg.sender);
        require(shares > 0, "No shares");
        
        uint256 assets = convertToAssets(shares);
        
        _burn(msg.sender, shares);
        totalAssets -= assets;
        userShares[msg.sender] = 0;
        
        asset.safeTransfer(msg.sender, assets);
        
        emit EmergencyWithdraw(msg.sender, assets);
    }
    
    // Admin functions
    function setStrategyEngine(address _strategyEngine) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_strategyEngine != address(0), "Invalid address");
        strategyEngine = IStrategyEngine(_strategyEngine);
    }
    
    function setMaxWithdrawal(uint256 _max) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxWithdrawalPerTx = _max;
    }
}