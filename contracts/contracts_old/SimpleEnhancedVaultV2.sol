// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IProtocolAdapter {
    function deposit(address asset, uint256 amount) external returns (uint256 shares);
    function withdraw(address asset, uint256 shares) external returns (uint256 amount);
    function getBalance(address asset) external view returns (uint256);
    function getCurrentAPY() external view returns (uint256);
}

interface IYieldMaxAIOptimizer {
    function calculateOptimalStrategy(
        address vault,
        uint256 currentStrategyId,
        uint256 userRiskTolerance
    ) external returns (uint256 optimalStrategyId, uint256 confidence);
}

/**
 * @title SimpleEnhancedVaultV2
 * @notice Simplified version that compiles easily
 */
contract SimpleEnhancedVaultV2 is ERC20, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable asset;
    IYieldMaxAIOptimizer public aiOptimizer;
    
    uint256 public currentStrategyId;
    address public currentProtocolAdapter;
    uint256 public lastRebalanceTimestamp;
    address public keeper;
    
    mapping(address => uint256) public userShares;
    
    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event StrategyChanged(uint256 indexed fromStrategy, uint256 indexed toStrategy);
    
    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "Not keeper");
        _;
    }
    
    constructor(
        address _asset,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        asset = IERC20(_asset);
        keeper = msg.sender;
    }
    
    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        require(assets > 0, "Zero deposit");
        
        shares = convertToShares(assets);
        require(shares > 0, "Zero shares");
        
        asset.safeTransferFrom(msg.sender, address(this), assets);
        
        _mint(receiver, shares);
        userShares[receiver] += shares;
        
        if (currentProtocolAdapter != address(0)) {
            asset.safeApprove(currentProtocolAdapter, assets);
            IProtocolAdapter(currentProtocolAdapter).deposit(address(asset), assets);
        }
        
        emit Deposited(msg.sender, assets, shares);
        return shares;
    }
    
    function withdraw(uint256 shares, address receiver, address owner) external returns (uint256 assets) {
        require(shares > 0, "Zero shares");
        require(shares <= balanceOf(owner), "Insufficient shares");
        
        if (msg.sender != owner) {
            uint256 allowed = allowance(owner, msg.sender);
            require(allowed >= shares, "Insufficient allowance");
            _approve(owner, msg.sender, allowed - shares);
        }
        
        assets = convertToAssets(shares);
        
        if (currentProtocolAdapter != address(0) && assets > 0) {
            IProtocolAdapter(currentProtocolAdapter).withdraw(address(asset), assets);
        }
        
        _burn(owner, shares);
        userShares[owner] -= shares;
        
        asset.safeTransfer(receiver, assets);
        
        emit Withdrawn(owner, assets, shares);
        return assets;
    }
    
    function checkAndRebalance() external onlyKeeper returns (bool) {
        if (address(aiOptimizer) == address(0)) return false;
        
        (uint256 newStrategyId, uint256 confidence) = aiOptimizer.calculateOptimalStrategy(
            address(this),
            currentStrategyId,
            50
        );
        
        if (newStrategyId != currentStrategyId && confidence >= 75) {
            _executeStrategyChange(newStrategyId);
            return true;
        }
        
        lastRebalanceTimestamp = block.timestamp;
        return false;
    }
    
    function _executeStrategyChange(uint256 newStrategyId) private {
        emit StrategyChanged(currentStrategyId, newStrategyId);
        currentStrategyId = newStrategyId;
        // In production: Actually move funds between protocols
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
        if (currentProtocolAdapter == address(0)) return 500; // 5% default
        return IProtocolAdapter(currentProtocolAdapter).getCurrentAPY();
    }
    
    // Admin functions
    function setAIOptimizer(address _aiOptimizer) external onlyOwner {
        aiOptimizer = IYieldMaxAIOptimizer(_aiOptimizer);
    }
    
    function setKeeper(address _keeper) external onlyOwner {
        keeper = _keeper;
    }
    
    function setProtocolAdapter(address _adapter) external onlyOwner {
        currentProtocolAdapter = _adapter;
    }
    
    function rebalanceInterval() external pure returns (uint256) {
        return 6 hours;
    }
}