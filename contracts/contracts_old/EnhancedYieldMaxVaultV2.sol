// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IProtocolAdapter {
    function deposit(address asset, uint256 amount) external returns (uint256 shares);
    function withdraw(address asset, uint256 shares) external returns (uint256 amount);
    function getBalance(address asset) external view returns (uint256);
    function getCurrentAPY() external view returns (uint256);
    function harvest() external returns (uint256);
}

interface IYieldMaxAIOptimizer {
    function calculateOptimalStrategy(
        address vault,
        uint256 currentStrategyId,
        uint256 userRiskTolerance
    ) external returns (uint256 optimalStrategyId, uint256 confidence);
    
    function getStrategy(uint256 strategyId) external view returns (
        string memory name,
        address protocol,
        uint256 chainId,
        uint256 expectedAPY,
        uint256 riskScore,
        bool isActive
    );
}

interface IProtocolRegistry {
    function getProtocol(uint256 id) external view returns (
        address adapter,
        string memory name,
        uint256 chainId,
        bool isActive
    );
}

/**
 * @title EnhancedYieldMaxVaultV2
 * @notice Complete implementation with AI optimization and protocol integrations
 */
contract EnhancedYieldMaxVaultV2 is ERC20, ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    
    // Roles
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    
    // Core components
    IERC20 public immutable asset;
    IYieldMaxAIOptimizer public aiOptimizer;
    IProtocolRegistry public protocolRegistry;
    
    // Strategy state
    uint256 public currentStrategyId;
    address public currentProtocolAdapter;
    uint256 public lastRebalanceTimestamp;
    uint256 public rebalanceInterval = 6 hours;
    
    // User preferences
    mapping(address => uint256) public userRiskTolerance; // 1-100
    mapping(address => uint256) public userShares;
    
    // Performance tracking
    uint256 public totalAssetsUnderManagement;
    uint256 public lifetimeYieldGenerated;
    uint256 public performanceFee = 1000; // 10% of yield
    
    // Events
    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event StrategyChanged(uint256 indexed fromStrategy, uint256 indexed toStrategy, uint256 confidence);
    event YieldHarvested(uint256 amount);
    event RebalanceExecuted(uint256 timestamp, uint256 gasUsed);
    
    constructor(
        address _asset,
        address _aiOptimizer,
        address _protocolRegistry,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        asset = IERC20(_asset);
        aiOptimizer = IYieldMaxAIOptimizer(_aiOptimizer);
        protocolRegistry = IProtocolRegistry(_protocolRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);
    }
    
    /**
     * @notice Deposit assets and receive shares
     */
    function deposit(uint256 assets, address receiver) external nonReentrant whenNotPaused returns (uint256 shares) {
        require(assets > 0, "Zero deposit");
        
        // Calculate shares
        shares = convertToShares(assets);
        require(shares > 0, "Zero shares");
        
        // Transfer assets from user
        asset.safeTransferFrom(msg.sender, address(this), assets);
        
        // Mint shares
        _mint(receiver, shares);
        userShares[receiver] += shares;
        totalAssetsUnderManagement += assets;
        
        // Deploy to current strategy if we have one
        if (currentProtocolAdapter != address(0)) {
            _deployToProtocol(assets);
        }
        
        emit Deposited(msg.sender, assets, shares);
        return shares;
    }
    
    /**
     * @notice Withdraw assets by burning shares
     */
    function withdraw(uint256 shares, address receiver, address owner) external nonReentrant returns (uint256 assets) {
        require(shares > 0, "Zero shares");
        require(shares <= balanceOf(owner), "Insufficient shares");
        
        if (msg.sender != owner) {
            uint256 allowed = allowance(owner, msg.sender);
            if (allowed != type(uint256).max) {
                require(allowed >= shares, "Insufficient allowance");
                _approve(owner, msg.sender, allowed - shares);
            }
        }
        
        // Calculate assets
        assets = convertToAssets(shares);
        require(assets > 0, "Zero assets");
        
        // Withdraw from protocol if needed
        if (currentProtocolAdapter != address(0)) {
            uint256 protocolBalance = IProtocolAdapter(currentProtocolAdapter).getBalance(address(asset));
            if (protocolBalance < assets) {
                // Withdraw what we can
                assets = protocolBalance;
            }
            if (assets > 0) {
                IProtocolAdapter(currentProtocolAdapter).withdraw(address(asset), assets);
            }
        }
        
        // Burn shares
        _burn(owner, shares);
        userShares[owner] -= shares;
        totalAssetsUnderManagement -= assets;
        
        // Transfer assets
        asset.safeTransfer(receiver, assets);
        
        emit Withdrawn(owner, assets, shares);
        return assets;
    }
    
    /**
     * @notice Check and execute rebalance if needed
     */
    function checkAndRebalance() external onlyRole(KEEPER_ROLE) returns (bool rebalanced) {
        if (block.timestamp < lastRebalanceTimestamp + rebalanceInterval) {
            return false;
        }
        
        uint256 gasStart = gasleft();
        
        // Get AI recommendation
        (uint256 newStrategyId, uint256 confidence) = aiOptimizer.calculateOptimalStrategy(
            address(this),
            currentStrategyId,
            50 // Default risk tolerance
        );
        
        // Execute if confidence is high enough
        if (newStrategyId != currentStrategyId && confidence >= 75) {
            _executeStrategyChange(newStrategyId);
            rebalanced = true;
        }
        
        // Harvest yields
        _harvestYields();
        
        lastRebalanceTimestamp = block.timestamp;
        uint256 gasUsed = gasStart - gasleft();
        
        emit RebalanceExecuted(block.timestamp, gasUsed);
        return rebalanced;
    }
    
    /**
     * @notice Execute strategy change
     */
    function _executeStrategyChange(uint256 newStrategyId) private {
        // Get new strategy details
        (,address newProtocol,,,,) = aiOptimizer.getStrategy(newStrategyId);
        
        // Withdraw from current protocol
        if (currentProtocolAdapter != address(0)) {
            uint256 balance = IProtocolAdapter(currentProtocolAdapter).getBalance(address(asset));
            if (balance > 0) {
                IProtocolAdapter(currentProtocolAdapter).withdraw(address(asset), balance);
            }
        }
        
        // Update strategy
        uint256 oldStrategyId = currentStrategyId;
        currentStrategyId = newStrategyId;
        currentProtocolAdapter = newProtocol;
        
        // Deploy to new protocol
        uint256 assetBalance = asset.balanceOf(address(this));
        if (assetBalance > 0 && newProtocol != address(0)) {
            _deployToProtocol(assetBalance);
        }
        
        emit StrategyChanged(oldStrategyId, newStrategyId, 75);
    }
    
    /**
     * @notice Deploy assets to current protocol
     */
    function _deployToProtocol(uint256 amount) private {
        asset.safeApprove(currentProtocolAdapter, amount);
        IProtocolAdapter(currentProtocolAdapter).deposit(address(asset), amount);
    }
    
    /**
     * @notice Harvest yields from current protocol
     */
    function _harvestYields() private {
        if (currentProtocolAdapter == address(0)) return;
        
        uint256 harvested = IProtocolAdapter(currentProtocolAdapter).harvest();
        if (harvested > 0) {
            // Take performance fee
            uint256 fee = (harvested * performanceFee) / 10000;
            if (fee > 0) {
                asset.safeTransfer(owner(), fee);
            }
            
            lifetimeYieldGenerated += harvested;
            emit YieldHarvested(harvested);
        }
    }
    
    /**
     * @notice Set user risk tolerance
     */
    function setRiskTolerance(uint256 tolerance) external {
        require(tolerance >= 1 && tolerance <= 100, "Invalid risk tolerance");
        userRiskTolerance[msg.sender] = tolerance;
    }
    
    /**
     * @notice Emergency withdraw all funds
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (currentProtocolAdapter != address(0)) {
            uint256 balance = IProtocolAdapter(currentProtocolAdapter).getBalance(address(asset));
            if (balance > 0) {
                IProtocolAdapter(currentProtocolAdapter).withdraw(address(asset), balance);
            }
        }
        
        uint256 totalBalance = asset.balanceOf(address(this));
        if (totalBalance > 0) {
            asset.safeTransfer(msg.sender, totalBalance);
        }
        
        _pause();
    }
    
    // View functions
    
    function totalAssets() public view returns (uint256) {
        uint256 vaultBalance = asset.balanceOf(address(this));
        uint256 protocolBalance = 0;
        
        if (currentProtocolAdapter != address(0)) {
            protocolBalance = IProtocolAdapter(currentProtocolAdapter).getBalance(address(asset));
        }
        
        return vaultBalance + protocolBalance;
    }
    
    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? assets : (assets * supply) / totalAssets();
    }
    
    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? shares : (shares * totalAssets()) / supply;
    }
    
    function getCurrentAPY() external view returns (uint256) {
        if (currentProtocolAdapter == address(0)) return 0;
        return IProtocolAdapter(currentProtocolAdapter).getCurrentAPY();
    }
    
    // Admin functions
    
    function updateAIOptimizer(address newOptimizer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        aiOptimizer = IYieldMaxAIOptimizer(newOptimizer);
    }
    
    function updateRebalanceInterval(uint256 newInterval) external onlyRole(STRATEGIST_ROLE) {
        rebalanceInterval = newInterval;
    }
    
    function updatePerformanceFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFee <= 2000, "Fee too high"); // Max 20%
        performanceFee = newFee;
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}