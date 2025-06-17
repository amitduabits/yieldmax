// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

// Interface for Strategy Engine
interface IStrategyEngine {
    function calculateOptimalAllocation(
        uint256 totalAssets,
        uint64[] calldata supportedChains,
        address[] calldata protocols
    ) external view returns (
        uint64[] memory targetChains,
        address[] memory targetProtocols,
        uint256[] memory allocations
    );
    
    function executeRebalance(
        uint256 amount,
        uint64 targetChain,
        address targetProtocol,
        bytes calldata strategyData
    ) external;
}

// Interface for LINK Token
interface LinkTokenInterface {
    function allowance(address owner, address spender) external view returns (uint256 remaining);
    function approve(address spender, uint256 value) external returns (bool success);
    function balanceOf(address owner) external view returns (uint256 balance);
    function decimals() external view returns (uint8 decimalPlaces);
    function decreaseApproval(address spender, uint256 addedValue) external returns (bool success);
    function increaseApproval(address spender, uint256 subtractedValue) external;
    function name() external view returns (string memory tokenName);
    function symbol() external view returns (string memory tokenSymbol);
    function totalSupply() external view returns (uint256 totalTokensIssued);
    function transfer(address to, uint256 value) external returns (bool success);
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool success);
    function transferFrom(address from, address to, uint256 value) external returns (bool success);
}

contract YieldMaxVault is 
    Initializable, 
    PausableUpgradeable, 
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable 
{
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGY_ROLE = keccak256("STRATEGY_ROLE");
    
    IERC20 public asset;
    IStrategyEngine public strategyEngine;
    IRouterClient public ccipRouter;
    LinkTokenInterface public linkToken;
    
    uint256 public totalAssets;
    uint256 public totalShares;
    uint256 public lastRebalance;
    uint256 public performanceFee; // basis points
    uint256 public withdrawalDelay;
    
    mapping(address => UserData) public userData;
    mapping(uint256 => WithdrawRequest) public withdrawRequests;
    mapping(uint64 => bool) public supportedChains;
    
    struct UserData {
        uint256 shares;
        uint256 pendingWithdraw;
        uint256 lastDeposit;
    }
    
    struct WithdrawRequest {
        address user;
        uint256 shares;
        uint256 requestTime;
        bool completed;
    }
    
    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event WithdrawRequested(address indexed user, uint256 requestId, uint256 shares);
    event WithdrawCompleted(address indexed user, uint256 amount);
    event CrossChainRebalance(uint64 destChain, uint256 amount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _asset,
        address _strategyEngine,
        address _ccipRouter,
        address _linkToken,
        address _keeper
    ) public initializer {
        __Pausable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, _keeper);
        
        asset = IERC20(_asset);
        strategyEngine = IStrategyEngine(_strategyEngine);
        ccipRouter = IRouterClient(_ccipRouter);
        linkToken = LinkTokenInterface(_linkToken);
        
        performanceFee = 1000; // 10%
        withdrawalDelay = 24 hours;
    }
    
    function deposit(uint256 amount, address receiver) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 shares) 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(receiver != address(0), "Invalid receiver");
        
        // Calculate shares
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalAssets;
        }
        
        // Transfer assets
        asset.transferFrom(msg.sender, address(this), amount);
        
        // Update state
        totalAssets += amount;
        totalShares += shares;
        userData[receiver].shares += shares;
        userData[receiver].lastDeposit = block.timestamp;
        
        emit Deposit(receiver, amount, shares);
    }
    
    function requestWithdraw(uint256 shares) 
        external 
        nonReentrant 
        returns (uint256 requestId) 
    {
        require(shares > 0, "Shares must be greater than 0");
        require(userData[msg.sender].shares >= shares, "Insufficient shares");
        
        requestId = uint256(keccak256(abi.encodePacked(msg.sender, shares, block.timestamp)));
        
        withdrawRequests[requestId] = WithdrawRequest({
            user: msg.sender,
            shares: shares,
            requestTime: block.timestamp,
            completed: false
        });
        
        userData[msg.sender].shares -= shares;
        userData[msg.sender].pendingWithdraw += shares;
        
        emit WithdrawRequested(msg.sender, requestId, shares);
    }
    
    function completeWithdraw(uint256 requestId) 
        external 
        nonReentrant 
        returns (uint256 amount) 
    {
        WithdrawRequest storage request = withdrawRequests[requestId];
        require(request.user == msg.sender, "Not your request");
        require(!request.completed, "Already completed");
        require(
            block.timestamp >= request.requestTime + withdrawalDelay,
            "Withdrawal delay not met"
        );
        
        // Calculate amount
        amount = (request.shares * totalAssets) / totalShares;
        
        // Update state
        request.completed = true;
        totalShares -= request.shares;
        totalAssets -= amount;
        userData[msg.sender].pendingWithdraw -= request.shares;
        
        // Transfer assets
        asset.transfer(msg.sender, amount);
        
        emit WithdrawCompleted(msg.sender, amount);
    }
    
    function executeCrossChainRebalance(
        uint64 destinationChain,
        address destinationVault,
        uint256 amount,
        bytes calldata strategyData
    ) external onlyRole(KEEPER_ROLE) {
        require(supportedChains[destinationChain], "Chain not supported");
        require(amount <= totalAssets / 10, "Amount too large"); // Max 10% per rebalance
        
        // Approve CCIP router
        asset.approve(address(ccipRouter), amount);
        linkToken.approve(address(ccipRouter), type(uint256).max);
        
        // Build CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(destinationVault),
            data: abi.encode(amount, strategyData),
            tokenAmounts: _buildTokenAmounts(amount),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 500_000})
            ),
            feeToken: address(linkToken)
        });
        
        // Calculate and check fees
        uint256 fees = ccipRouter.getFee(destinationChain, message);
        require(linkToken.balanceOf(address(this)) >= fees, "Insufficient LINK");
        
        // Send cross-chain message
        bytes32 messageId = ccipRouter.ccipSend(destinationChain, message);
        
        // Update state
        totalAssets -= amount;
        lastRebalance = block.timestamp;
        
        emit CrossChainRebalance(destinationChain, amount);
    }
    
    function _buildTokenAmounts(uint256 amount) 
        private 
        view 
        returns (Client.EVMTokenAmount[] memory) 
    {
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(asset),
            amount: amount
        });
        return tokenAmounts;
    }
    
    function setSupportedChain(uint64 chainSelector, bool supported) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        supportedChains[chainSelector] = supported;
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Batch deposit function for gas optimization
    function batchDeposit(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyRole(KEEPER_ROLE) {
        require(users.length == amounts.length, "Length mismatch");
        
        uint256 totalAmount;
        for (uint256 i = 0; i < users.length; i++) {
            totalAmount += amounts[i];
        }
        
        // Single transfer for all deposits
        asset.transferFrom(msg.sender, address(this), totalAmount);
        
        // Process each deposit
        for (uint256 i = 0; i < users.length; i++) {
            _processDeposit(users[i], amounts[i]);
        }
    }

    // Internal function to process individual deposits
    function _processDeposit(address user, uint256 amount) internal {
        require(amount > 0, "Amount must be greater than 0");
        require(user != address(0), "Invalid user");
        
        // Calculate shares
        uint256 shares;
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalAssets;
        }
        
        // Update state
        totalAssets += amount;
        totalShares += shares;
        userData[user].shares += shares;
        userData[user].lastDeposit = block.timestamp;
        
        emit Deposit(user, amount, shares);
    }
    
    // MEV protection modifier
    modifier mevProtection() {
        require(
            tx.gasprice <= block.basefee + 2 gwei,
            "Gas price too high - possible MEV"
        );
        _;
    }

    // View functions
    function getUserData(address user) external view returns (UserData memory) {
        return userData[user];
    }
    
    function getWithdrawRequest(uint256 requestId) external view returns (WithdrawRequest memory) {
        return withdrawRequests[requestId];
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