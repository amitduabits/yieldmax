// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IStrategyEngine {
    function getCurrentStrategy() external view returns (
        string memory protocolName,
        uint256 allocation,
        uint256 expectedAPY,
        uint256 riskScore,
        uint256 confidence,
        uint256 timestamp
    );
    
    function getBestYield(uint256 amount) external view returns (
        string memory protocol,
        uint256 expectedAPY
    );
}

interface IYieldProtocol {
    function deposit(uint256 amount) external returns (uint256);
    function withdraw(uint256 amount) external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

// Mock protocol adapters for testing
contract MockAaveAdapter {
    IERC20 public usdc;
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;
    
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }
    
    function deposit(uint256 amount) external returns (uint256) {
        usdc.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        totalDeposits += amount;
        return amount;
    }
    
    function withdraw(uint256 amount) external returns (uint256) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        usdc.transfer(msg.sender, amount);
        return amount;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}

contract EnhancedYieldMaxVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Core state
    IERC20 public immutable usdc;
    IStrategyEngine public strategyEngine;
    
    // Protocol adapters
    mapping(string => address) public protocolAdapters;
    string public currentProtocol;
    address public currentAdapter;
    
    // User accounting
    mapping(address => uint256) public userShares;
    uint256 public totalShares;
    uint256 public totalAssetsDeployed;
    
    // Yield tracking
    uint256 public lastHarvestTime;
    uint256 public totalYieldEarned;
    mapping(address => uint256) public userYieldClaimed;
    
    // Events
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 amount);
    event StrategyExecuted(string from, string to, uint256 amount);
    event YieldHarvested(uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);
    
    constructor(
        address _usdc,
        address _strategyEngine
    ) {
        usdc = IERC20(_usdc);
        strategyEngine = IStrategyEngine(_strategyEngine);
        lastHarvestTime = block.timestamp;
    }
    
    // Initialize protocol adapters
    function initializeAdapters(
        address _aaveAdapter,
        address _compoundAdapter,
        address _yearnAdapter,
        address _curveAdapter
    ) external onlyOwner {
        protocolAdapters["Aave V3"] = _aaveAdapter;
        protocolAdapters["Compound V3"] = _compoundAdapter;
        protocolAdapters["Yearn Finance"] = _yearnAdapter;
        protocolAdapters["Curve 3Pool"] = _curveAdapter;
        
        // Set initial protocol
        currentProtocol = "Aave V3";
        currentAdapter = _aaveAdapter;
    }
    
    // User deposits USDC
    function deposit(uint256 amount, address receiver) external nonReentrant returns (uint256 shares) {
        require(amount > 0, "Zero deposit");
        
        // Transfer USDC from user
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate shares
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalAssets();
        }
        
        // Update state
        userShares[receiver] += shares;
        totalShares += shares;
        
        // Deploy capital to current strategy
        _deployCapital(amount);
        
        emit Deposited(receiver, amount, shares);
    }
    
    // User withdraws shares
    function withdraw(uint256 shares) external nonReentrant returns (uint256 amount) {
        require(shares > 0 && shares <= userShares[msg.sender], "Invalid shares");
        
        // Calculate amount
        amount = (shares * totalAssets()) / totalShares;
        
        // Update state
        userShares[msg.sender] -= shares;
        totalShares -= shares;
        
        // Get funds from protocol if needed
        uint256 vaultBalance = usdc.balanceOf(address(this));
        if (vaultBalance < amount) {
            _withdrawFromProtocol(amount - vaultBalance);
        }
        
        // Transfer USDC to user
        usdc.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, shares, amount);
    }
    
    // Execute strategy based on AI recommendation
    function executeStrategy() external nonReentrant {
        // Get current strategy recommendation
        (
            string memory recommendedProtocol,
            ,
            uint256 expectedAPY,
            ,
            ,
        ) = strategyEngine.getCurrentStrategy();
        
        // Check if we need to switch
        if (keccak256(bytes(recommendedProtocol)) == keccak256(bytes(currentProtocol))) {
            return; // Already in optimal protocol
        }
        
        // Get the new adapter
        address newAdapter = protocolAdapters[recommendedProtocol];
        require(newAdapter != address(0), "Protocol not supported");
        
        // Calculate total to move
        uint256 amountToMove = 0;
        if (currentAdapter != address(0)) {
            // Withdraw all from current protocol
            amountToMove = IYieldProtocol(currentAdapter).balanceOf(address(this));
            if (amountToMove > 0) {
                IYieldProtocol(currentAdapter).withdraw(amountToMove);
            }
        }
        
        // Add any idle USDC
        amountToMove = usdc.balanceOf(address(this));
        
        emit StrategyExecuted(currentProtocol, recommendedProtocol, amountToMove);
        
        // Update current protocol
        string memory oldProtocol = currentProtocol;
        currentProtocol = recommendedProtocol;
        currentAdapter = newAdapter;
        
        // Deploy to new protocol
        if (amountToMove > 0) {
            _deployCapital(amountToMove);
        }
    }
    
    // Deploy capital to current protocol
    function _deployCapital(uint256 amount) private {
        if (currentAdapter == address(0) || amount == 0) return;
        
        // Approve and deposit
        usdc.safeApprove(currentAdapter, amount);
        IYieldProtocol(currentAdapter).deposit(amount);
        totalAssetsDeployed += amount;
    }
    
    // Withdraw from current protocol
    function _withdrawFromProtocol(uint256 amount) private {
        if (currentAdapter == address(0)) return;
        
        uint256 protocolBalance = IYieldProtocol(currentAdapter).balanceOf(address(this));
        uint256 toWithdraw = amount > protocolBalance ? protocolBalance : amount;
        
        if (toWithdraw > 0) {
            IYieldProtocol(currentAdapter).withdraw(toWithdraw);
            totalAssetsDeployed -= toWithdraw;
        }
    }
    
    // Harvest yields (calculate earnings)
    function harvest() external {
        uint256 currentTotal = totalAssets();
        uint256 lastTotal = totalShares; // Simplified - in production track properly
        
        if (currentTotal > lastTotal) {
            uint256 yield = currentTotal - lastTotal;
            totalYieldEarned += yield;
            lastHarvestTime = block.timestamp;
            
            emit YieldHarvested(yield);
        }
    }
    
    // Get total assets (deployed + idle)
    function totalAssets() public view returns (uint256) {
        uint256 idle = usdc.balanceOf(address(this));
        uint256 deployed = 0;
        
        if (currentAdapter != address(0)) {
            deployed = IYieldProtocol(currentAdapter).balanceOf(address(this));
        }
        
        // Add estimated yield based on APY
        uint256 timePassed = block.timestamp - lastHarvestTime;
        (, , uint256 currentAPY, , ,) = strategyEngine.getCurrentStrategy();
        uint256 estimatedYield = (deployed * currentAPY * timePassed) / (365 days * 10000);
        
        return idle + deployed + estimatedYield;
    }
    
    // Get user's share value
    function getUserShareValue(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (userShares[user] * totalAssets()) / totalShares;
    }
    
    // For existing interface compatibility
    function getUserShares(address user) external view returns (uint256) {
        return userShares[user];
    }
    
    function totalSupply() external view returns (uint256) {
        return totalShares;
    }
    
    // Admin functions
    function updateStrategyEngine(address _newEngine) external onlyOwner {
        strategyEngine = IStrategyEngine(_newEngine);
    }
    
    function addProtocolAdapter(string memory protocol, address adapter) external onlyOwner {
        protocolAdapters[protocol] = adapter;
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        if (currentAdapter != address(0)) {
            uint256 balance = IYieldProtocol(currentAdapter).balanceOf(address(this));
            if (balance > 0) {
                IYieldProtocol(currentAdapter).withdraw(balance);
            }
        }
        
        uint256 vaultBalance = usdc.balanceOf(address(this));
        if (vaultBalance > 0) {
            usdc.safeTransfer(owner(), vaultBalance);
        }
    }
}