// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IStrategyEngine {
    function getCurrentStrategy() external view returns (
        string memory protocolName,
        uint256 allocation,
        uint256 expectedAPY,
        uint256 riskScore,
        uint256 confidence,
        uint256 timestamp
    );
}

// Simple Enhanced Vault without external dependencies
contract SimpleEnhancedVault {
    IERC20 public usdc;
    IStrategyEngine public strategyEngine;
    
    address public owner;
    bool private locked;
    
    // Protocol adapters
    mapping(string => address) public protocolAdapters;
    string public currentProtocol;
    address public currentAdapter;
    
    // User accounting
    mapping(address => uint256) public userShares;
    uint256 public totalShares;
    
    // Simple adapter tracking
    mapping(address => uint256) public adapterBalances;
    
    // Events
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 amount);
    event StrategyExecuted(string from, string to, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    constructor(address _usdc, address _strategyEngine) {
        usdc = IERC20(_usdc);
        strategyEngine = IStrategyEngine(_strategyEngine);
        owner = msg.sender;
        currentProtocol = "Aave V3";
    }
    
    // Initialize protocol adapters (simplified - just track addresses)
    function initializeAdapters(
        address _aave,
        address _compound,
        address _yearn,
        address _curve
    ) external onlyOwner {
        protocolAdapters["Aave V3"] = _aave;
        protocolAdapters["Compound V3"] = _compound;
        protocolAdapters["Yearn Finance"] = _yearn;
        protocolAdapters["Curve 3Pool"] = _curve;
        
        currentAdapter = _aave;
    }
    
    // Deposit function
    function deposit(uint256 amount, address receiver) external nonReentrant returns (uint256 shares) {
        require(amount > 0, "Zero amount");
        
        // Transfer USDC
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Calculate shares
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalAssets();
        }
        
        // Update state
        userShares[receiver] += shares;
        totalShares += shares;
        
        // Track in current adapter
        if (currentAdapter != address(0)) {
            adapterBalances[currentAdapter] += amount;
        }
        
        emit Deposited(receiver, amount, shares);
    }
    
    // Withdraw function
    function withdraw(uint256 shares) external nonReentrant returns (uint256 amount) {
        require(shares > 0 && shares <= userShares[msg.sender], "Invalid shares");
        
        // Calculate amount
        amount = (shares * totalAssets()) / totalShares;
        
        // Update state
        userShares[msg.sender] -= shares;
        totalShares -= shares;
        
        // Update adapter balance
        if (currentAdapter != address(0) && adapterBalances[currentAdapter] >= amount) {
            adapterBalances[currentAdapter] -= amount;
        }
        
        // Transfer USDC
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdrawn(msg.sender, shares, amount);
    }
    
    // Execute strategy based on recommendation
    function executeStrategy() external nonReentrant {
        // Get recommendation
        (string memory recommendedProtocol,,,,,) = strategyEngine.getCurrentStrategy();
        
        // Check if change needed
        if (keccak256(bytes(recommendedProtocol)) == keccak256(bytes(currentProtocol))) {
            return;
        }
        
        // Get new adapter
        address newAdapter = protocolAdapters[recommendedProtocol];
        require(newAdapter != address(0), "Protocol not supported");
        
        // Move funds (simplified - just update tracking)
        uint256 amountToMove = adapterBalances[currentAdapter];
        adapterBalances[currentAdapter] = 0;
        adapterBalances[newAdapter] = amountToMove;
        
        emit StrategyExecuted(currentProtocol, recommendedProtocol, amountToMove);
        
        // Update current protocol
        currentProtocol = recommendedProtocol;
        currentAdapter = newAdapter;
    }
    
    // Get total assets
    function totalAssets() public view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
    
    // Get user share value
    function getUserShareValue(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (userShares[user] * totalAssets()) / totalShares;
    }
    
    // Compatible with existing interface
    function getUserShares(address user) external view returns (uint256) {
        return userShares[user];
    }
    
    function totalSupply() external view returns (uint256) {
        return totalShares;
    }
    
    // Get info about current strategy
    function getCurrentStrategyInfo() external view returns (
        string memory protocol,
        address adapter,
        uint256 balance
    ) {
        return (
            currentProtocol,
            currentAdapter,
            adapterBalances[currentAdapter]
        );
    }
    
    // Admin functions
    function updateStrategyEngine(address _newEngine) external onlyOwner {
        strategyEngine = IStrategyEngine(_newEngine);
    }
    
    // Allow strategy execution by automation
    function canExecuteStrategy() external view returns (bool) {
        (string memory recommendedProtocol,,,,,) = strategyEngine.getCurrentStrategy();
        return keccak256(bytes(recommendedProtocol)) != keccak256(bytes(currentProtocol));
    }
}