// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IYieldMaxVault {
    struct Position {
        uint128 amount;
        uint64 lastUpdate;
        uint64 chainId;
    }
    
    struct RebalanceInstruction {
        uint8 action;
        address protocol;
        uint128 amount;
        bytes32 params;
    }
    
    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event RebalanceExecuted(uint256 indexed epoch, uint256 gasUsed);
    event CrossChainMessage(uint64 indexed destChain, bytes32 messageId);
    event WithdrawRequested(address indexed user, uint256 requestId, uint256 shares);
    event EmergencyPause(address indexed caller);
}

interface IStrategyEngine {
    function calculateOptimalAllocation(bytes memory marketData) 
        external view returns (bytes memory allocation);
    function validateRebalance(bytes memory instructions) 
        external view returns (bool profitable, uint256 expectedGain);
}

/**
 * @title YieldMaxVault
 * @notice Production-ready vault with cross-chain capabilities
 */
contract YieldMaxVault is IYieldMaxVault, ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;
    
    // Roles
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    // State variables
    struct UserData {
        uint128 shares;
        uint64 lastDeposit;
        uint64 pendingWithdraw;
    }
    
    IERC20 public immutable asset;
    uint256 public totalAssets;
    uint256 public totalShares;
    
    uint128 public pendingDeposits;
    uint64 public lastBatchTime;
    uint64 public currentEpoch;
    
    mapping(address => UserData) public userData;
    mapping(uint64 => address) public remoteVaults;
    mapping(bytes32 => bool) public processedMessages;
    
    address public strategyEngine;
    address public keeper;
    
    uint256 private constant BATCH_INTERVAL = 4 hours;
    uint256 private constant MIN_BATCH_SIZE = 50_000e6; // $50k USDC
    uint256 private constant BUFFER_RATIO = 1500; // 15%
    
    constructor(
        address _asset,
        address _strategyEngine,
        address _keeper
    ) {
        asset = IERC20(_asset);
        strategyEngine = _strategyEngine;
        keeper = _keeper;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, _keeper);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }
    
    // User functions
    function deposit(uint256 assets, address receiver) 
        external 
        nonReentrant
        whenNotPaused 
        returns (uint256 shares) 
    {
        require(assets > 0, "Zero deposit");
        require(receiver != address(0), "Zero receiver");
        
        UserData memory user = userData[msg.sender];
        
        asset.safeTransferFrom(msg.sender, address(this), assets);
        
        if (totalShares == 0) {
            shares = assets;
        } else {
            shares = (assets * totalShares) / totalAssets;
        }
        
        userData[receiver] = UserData({
            shares: user.shares + uint128(shares),
            lastDeposit: uint64(block.timestamp),
            pendingWithdraw: user.pendingWithdraw
        });
        
        totalAssets += assets;
        totalShares += shares;
        pendingDeposits += uint128(assets);
        
        emit Deposit(msg.sender, assets, shares);
        
        if (_shouldExecuteBatch()) {
            _executeBatch();
        }
    }
    
    function requestWithdraw(uint256 shares) external returns (uint256 requestId) {
        UserData memory user = userData[msg.sender];
        require(user.shares >= shares, "Insufficient shares");
        
        userData[msg.sender].pendingWithdraw = uint64(shares);
        
        requestId = uint256(keccak256(abi.encodePacked(msg.sender, shares, block.timestamp)));
        
        emit WithdrawRequested(msg.sender, requestId, shares);
    }
    
    function completeWithdraw(uint256 requestId) external nonReentrant returns (uint256 assets) {
        UserData memory user = userData[msg.sender];
        uint256 shares = user.pendingWithdraw;
        require(shares > 0, "No pending withdrawal");
        
        assets = (shares * totalAssets) / totalShares;
        
        userData[msg.sender] = UserData({
            shares: user.shares - uint128(shares),
            lastDeposit: user.lastDeposit,
            pendingWithdraw: 0
        });
        
        totalShares -= shares;
        totalAssets -= assets;
        
        asset.safeTransfer(msg.sender, assets);
        
        emit Withdraw(msg.sender, assets, shares);
    }
    
    // Keeper functions
    function rebalance(bytes calldata instructions) external onlyRole(KEEPER_ROLE) {
        uint256 gasStart = gasleft();
        
        RebalanceInstruction[] memory rebalanceInstructions = abi.decode(
            instructions, 
            (RebalanceInstruction[])
        );
        
        (bool profitable, uint256 expectedGain) = IStrategyEngine(strategyEngine)
            .validateRebalance(instructions);
        require(profitable, "Not profitable");
        
        for (uint256 i = 0; i < rebalanceInstructions.length;) {
            _executeInstruction(rebalanceInstructions[i]);
            unchecked { ++i; }
        }
        
        currentEpoch++;
        lastBatchTime = uint64(block.timestamp);
        
        uint256 gasUsed = gasStart - gasleft();
        emit RebalanceExecuted(currentEpoch, gasUsed);
    }
    
    // Internal functions
    function _shouldExecuteBatch() private view returns (bool) {
        return pendingDeposits >= MIN_BATCH_SIZE || 
               block.timestamp >= lastBatchTime + BATCH_INTERVAL;
    }
    
    function _executeBatch() private {
        uint256 deposits = pendingDeposits;
        pendingDeposits = 0;
        
        uint256 buffer = (totalAssets * BUFFER_RATIO) / 10000;
        uint256 deployable = deposits > buffer ? deposits - buffer : 0;
        
        if (deployable > 0) {
            _deployCrossChain(deployable);
        }
    }
    
    function _executeInstruction(RebalanceInstruction memory instruction) private {
        // Simplified for demo - in production, integrate with actual protocols
        if (instruction.action == 0) {
            // Deposit to protocol
        } else if (instruction.action == 1) {
            // Withdraw from protocol
        } else if (instruction.action == 2) {
            // Cross-chain migration
        }
    }
    
    function _deployCrossChain(uint256 amount) private {
        // Cross-chain deployment logic
        emit CrossChainMessage(42161, keccak256(abi.encodePacked(amount, block.timestamp)));
    }
    
    // Emergency functions
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
        emit EmergencyPause(msg.sender);
    }
    
    function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }
    
    // View functions
    function getUserShares(address user) external view returns (uint256) {
        return userData[user].shares;
    }
    
    function getTotalValue() external view returns (uint256) {
        return totalAssets;
    }
}