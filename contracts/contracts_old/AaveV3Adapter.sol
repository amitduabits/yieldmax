// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IProtocolAdapter
 * @notice Standard interface for all protocol adapters
 */
interface IProtocolAdapter {
    function deposit(address asset, uint256 amount) external returns (uint256 shares);
    function withdraw(address asset, uint256 shares) external returns (uint256 amount);
    function getBalance(address asset) external view returns (uint256);
    function getCurrentAPY() external view returns (uint256);
    function harvest() external returns (uint256);
}

/**
 * @title AaveV3Adapter
 * @notice Adapter for Aave V3 protocol integration
 */
contract AaveV3Adapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    address public immutable aavePool;
    address public immutable aToken;
    mapping(address => bool) public authorizedVaults;
    
    event Deposited(address indexed asset, uint256 amount);
    event Withdrawn(address indexed asset, uint256 amount);
    event Harvested(uint256 amount);
    
    modifier onlyAuthorized() {
        require(authorizedVaults[msg.sender], "Unauthorized");
        _;
    }
    
    constructor(address _aavePool, address _aToken) {
        aavePool = _aavePool;
        aToken = _aToken;
    }
    
    function deposit(address asset, uint256 amount) external onlyAuthorized returns (uint256 shares) {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(asset).safeApprove(aavePool, amount);
        
        // In production: Call Aave's supply function
        // For demo: Simulate by holding tokens
        shares = amount; // 1:1 for simplicity
        
        emit Deposited(asset, amount);
        return shares;
    }
    
    function withdraw(address asset, uint256 shares) external onlyAuthorized returns (uint256 amount) {
        // In production: Call Aave's withdraw function
        // For demo: Transfer back tokens
        amount = shares; // 1:1 for simplicity
        
        IERC20(asset).safeTransfer(msg.sender, amount);
        emit Withdrawn(asset, amount);
        return amount;
    }
    
    function getBalance(address asset) external view returns (uint256) {
        // In production: Query aToken balance
        return IERC20(asset).balanceOf(address(this));
    }
    
    function getCurrentAPY() external pure returns (uint256) {
        // In production: Query from Aave
        return 550; // 5.5% in basis points
    }
    
    function harvest() external onlyAuthorized returns (uint256) {
        // In production: Claim rewards
        emit Harvested(0);
        return 0;
    }
    
    function authorizeVault(address vault, bool authorized) external onlyOwner {
        authorizedVaults[vault] = authorized;
    }
}

/**
 * @title CompoundV3Adapter
 * @notice Adapter for Compound V3 protocol integration
 */
contract CompoundV3Adapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    address public immutable compoundComet;
    mapping(address => bool) public authorizedVaults;
    
    modifier onlyAuthorized() {
        require(authorizedVaults[msg.sender], "Unauthorized");
        _;
    }
    
    constructor(address _compoundComet) {
        compoundComet = _compoundComet;
    }
    
    function deposit(address asset, uint256 amount) external onlyAuthorized returns (uint256 shares) {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        // In production: Supply to Compound
        shares = amount;
        return shares;
    }
    
    function withdraw(address asset, uint256 shares) external onlyAuthorized returns (uint256 amount) {
        amount = shares;
        IERC20(asset).safeTransfer(msg.sender, amount);
        return amount;
    }
    
    function getBalance(address asset) external view returns (uint256) {
        return IERC20(asset).balanceOf(address(this));
    }
    
    function getCurrentAPY() external pure returns (uint256) {
        return 480; // 4.8%
    }
    
    function harvest() external onlyAuthorized returns (uint256) {
        return 0;
    }
    
    function authorizeVault(address vault, bool authorized) external onlyOwner {
        authorizedVaults[vault] = authorized;
    }
}

/**
 * @title GMXAdapter
 * @notice Adapter for GMX GLP integration (Arbitrum)
 */
contract GMXAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    address public immutable glpManager;
    address public immutable rewardRouter;
    mapping(address => bool) public authorizedVaults;
    
    modifier onlyAuthorized() {
        require(authorizedVaults[msg.sender], "Unauthorized");
        _;
    }
    
    constructor(address _glpManager, address _rewardRouter) {
        glpManager = _glpManager;
        rewardRouter = _rewardRouter;
    }
    
    function deposit(address asset, uint256 amount) external onlyAuthorized returns (uint256 shares) {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        // In production: Mint GLP tokens
        shares = amount * 95 / 100; // Simulate some slippage
        return shares;
    }
    
    function withdraw(address asset, uint256 shares) external onlyAuthorized returns (uint256 amount) {
        // In production: Burn GLP and receive asset
        amount = shares * 95 / 100; // Simulate slippage
        IERC20(asset).safeTransfer(msg.sender, amount);
        return amount;
    }
    
    function getBalance(address asset) external view returns (uint256) {
        return IERC20(asset).balanceOf(address(this));
    }
    
    function getCurrentAPY() external pure returns (uint256) {
        return 2100; // 21% - High yield!
    }
    
    function harvest() external onlyAuthorized returns (uint256 rewards) {
        // In production: Claim GMX rewards
        rewards = 100 * 1e6; // Simulate 100 USDC rewards
        return rewards;
    }
    
    function authorizeVault(address vault, bool authorized) external onlyOwner {
        authorizedVaults[vault] = authorized;
    }
}

/**
 * @title ProtocolRegistry
 * @notice Central registry for all protocol adapters
 */
contract ProtocolRegistry is Ownable {
    struct ProtocolInfo {
        address adapter;
        string name;
        uint256 chainId;
        bool isActive;
    }
    
    mapping(uint256 => ProtocolInfo) public protocols;
    uint256 public protocolCount;
    
    event ProtocolRegistered(uint256 indexed id, string name, address adapter);
    event ProtocolStatusUpdated(uint256 indexed id, bool isActive);
    
    function registerProtocol(
        string memory name,
        address adapter,
        uint256 chainId
    ) external onlyOwner returns (uint256) {
        uint256 id = protocolCount++;
        protocols[id] = ProtocolInfo({
            adapter: adapter,
            name: name,
            chainId: chainId,
            isActive: true
        });
        
        emit ProtocolRegistered(id, name, adapter);
        return id;
    }
    
    function updateProtocolStatus(uint256 id, bool isActive) external onlyOwner {
        protocols[id].isActive = isActive;
        emit ProtocolStatusUpdated(id, isActive);
    }
    
    function getProtocol(uint256 id) external view returns (ProtocolInfo memory) {
        return protocols[id];
    }
}