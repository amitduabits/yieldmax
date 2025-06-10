// contracts/YieldMaxVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IStrategyEngine {
    function calculateOptimalAllocation(bytes memory marketData) 
        external view returns (bytes memory allocation);
    function validateRebalance(bytes memory instructions) 
        external view returns (bool profitable, uint256 expectedGain);
}

contract YieldMaxVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Events
    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event RebalanceExecuted(uint256 indexed epoch, uint256 gasUsed);
    event EmergencyPause(address indexed caller);
    event KeeperUpdated(address indexed newKeeper);
    event CrossChainRouterUpdated(address indexed newRouter);
    event WithdrawRequested(address indexed user, uint256 requestId, uint256 shares);
    
    // Packed struct for gas efficiency
    struct UserData {
        uint128 shares;
        uint64 lastDeposit;
        uint64 pendingWithdraw;
    }
    
    struct RebalanceInstruction {
        uint8 action;
        address protocol;
        uint128 amount;
        bytes32 params;
    }
    
    // State variables
    IERC20 public immutable asset;
    address public strategyEngine;
    address public keeper;
    address public crossChainRouter;
    
    uint256 public totalAssets;
    uint256 public totalShares;
    uint256 public currentEpoch;
    
    mapping(address => UserData) public userData;
    mapping(bytes32 => bool) public processedMessages;
    
    bool private _paused;
    
    modifier onlyKeeper() {
        require(msg.sender == keeper, "Not keeper");
        _;
    }
    
    modifier whenNotPaused() {
        require(!_paused, "Paused");
        _;
    }
    
    constructor(
        address _asset,
        address _strategyEngine,
        address _keeper
    ) {
        asset = IERC20(_asset);
        strategyEngine = _strategyEngine;
        keeper = _keeper;
    }
    
    function deposit(uint256 assets, address receiver) 
        external 
        nonReentrant
        whenNotPaused 
        returns (uint256 shares) 
    {
        require(assets > 0, "Zero deposit");
        require(receiver != address(0), "Invalid receiver");
        
        // Transfer assets
        asset.safeTransferFrom(msg.sender, address(this), assets);
        
        // Calculate shares
        if (totalShares == 0) {
            shares = assets;
        } else {
            shares = (assets * totalShares) / totalAssets;
        }
        
        // Update state
        userData[receiver].shares += uint128(shares);
        userData[receiver].lastDeposit = uint64(block.timestamp);
        
        totalAssets += assets;
        totalShares += shares;
        
        emit Deposit(msg.sender, assets, shares);
    }
    
    function requestWithdraw(uint256 shares) external returns (uint256 requestId) {
        UserData memory user = userData[msg.sender];
        require(user.shares >= shares, "Insufficient shares");
        
        userData[msg.sender].pendingWithdraw = uint64(shares);
        requestId = uint256(keccak256(abi.encodePacked(msg.sender, shares, block.timestamp)));
        
        emit WithdrawRequested(msg.sender, requestId, shares);
    }
    
    function completeWithdraw(uint256 requestId) 
        external 
        nonReentrant
        returns (uint256 assets) 
    {
        UserData memory user = userData[msg.sender];
        uint256 shares = user.pendingWithdraw;
        require(shares > 0, "No pending withdrawal");
        
        // Calculate assets
        assets = (shares * totalAssets) / totalShares;
        
        // Update state
        userData[msg.sender].shares -= uint128(shares);
        userData[msg.sender].pendingWithdraw = 0;
        
        totalShares -= shares;
        totalAssets -= assets;
        
        // Transfer assets
        asset.safeTransfer(msg.sender, assets);
        
        emit Withdraw(msg.sender, assets, shares);
    }
    
    function rebalance(bytes calldata instructions) external onlyKeeper {
        uint256 gasStart = gasleft();
        
        RebalanceInstruction[] memory rebalanceInstructions = abi.decode(
            instructions, 
            (RebalanceInstruction[])
        );
        
        (bool profitable, ) = IStrategyEngine(strategyEngine).validateRebalance(instructions);
        require(profitable, "Not profitable");
        
        // Execute rebalancing logic here
        currentEpoch++;
        
        uint256 gasUsed = gasStart - gasleft();
        emit RebalanceExecuted(currentEpoch, gasUsed);
    }
    
    // Admin functions
    function setKeeper(address _keeper) external onlyOwner {
        require(_keeper != address(0), "Invalid keeper");
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }
    
    function setCrossChainRouter(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router");
        crossChainRouter = _router;
        emit CrossChainRouterUpdated(_router);
    }
    
    function emergencyPause() external onlyOwner {
        _paused = true;
        emit EmergencyPause(msg.sender);
    }
    
    function unpause() external onlyOwner {
        _paused = false;
    }
}
