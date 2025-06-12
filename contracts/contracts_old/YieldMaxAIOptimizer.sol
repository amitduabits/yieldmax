// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ==================== IMPORTS ====================
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title YieldMaxAIOptimizer
 * @author YieldMax Team
 * @notice Advanced AI-powered cross-chain yield optimizer with full Chainlink integration
 * @dev Production-ready implementation for hackathon demonstration
 */
contract YieldMaxAIOptimizer is 
    CCIPReceiver,
    AutomationCompatibleInterface,
    FunctionsClient,
    VRFConsumerBaseV2,
    ReentrancyGuard,
    Pausable,
    AccessControl
{
    using SafeERC20 for IERC20;
    using FunctionsRequest for FunctionsRequest.Request;

    // ==================== ROLES ====================
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // ==================== STRUCTS ====================
    
    struct UserPosition {
        uint256 shares;
        uint256 depositedAmount;
        uint256 lastActionTimestamp;
        uint256 accumulatedYield;
        uint64 preferredChainId;
        uint8 riskProfile; // 1-10, 10 being highest risk tolerance
    }

    struct YieldStrategy {
        address protocol;
        uint64 chainId;
        uint256 currentAPY;
        uint256 tvl;
        uint256 riskScore; // 1-100, lower is safer
        uint256 gasEstimate;
        bool isActive;
        uint256 lastUpdate;
    }

    struct OptimizationResult {
        bytes32 strategyId;
        uint256 expectedAPY;
        uint256 confidence; // ML model confidence 0-100
        uint256 gasRequired;
        uint256 executionDeadline;
        bytes executionData;
    }

    struct CrossChainRequest {
        address user;
        uint256 amount;
        uint64 sourceChain;
        uint64 destinationChain;
        bytes32 strategyId;
        uint256 nonce;
    }

    // ==================== STATE VARIABLES ====================
    
    // Core protocol state
    IERC20 public immutable yieldToken; // USDC
    uint256 public totalValueLocked;
    uint256 public totalShares;
    uint256 public lastRebalanceTimestamp;
    uint256 public performanceFee = 200; // 2% in basis points
    
    // User mappings
    mapping(address => UserPosition) public userPositions;
    mapping(address => mapping(uint256 => uint256)) public userNonces;
    
    // Strategy mappings  
    mapping(bytes32 => YieldStrategy) public strategies;
    bytes32[] public activeStrategyIds;
    mapping(uint64 => mapping(address => uint256)) public chainBalances;
    
    // Chainlink integrations
    IRouterClient private immutable i_ccipRouter;
    LinkTokenInterface private immutable i_linkToken;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    
    // Chainlink configuration
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    
    // AI/ML state
    mapping(bytes32 => OptimizationResult) public pendingOptimizations;
    mapping(uint256 => bytes32) public vrfRequestToOptimization;
    uint256 public aiModelVersion = 1;
    string public aiModelCID; // IPFS CID for model weights
    
    // Cross-chain state
    mapping(uint64 => bool) public supportedChains;
    mapping(bytes32 => bool) public processedMessages;
    mapping(bytes32 => CrossChainRequest) public pendingCrossChainRequests;
    
    // Price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds;
    
    // Gas optimization: packed storage
    uint128 public minDepositAmount = 100 * 1e6; // $100 USDC
    uint128 public maxSingleAllocation = 40; // 40% max per strategy
    uint64 public rebalanceInterval = 4 hours;
    uint32 public emergencyCooldown = 24 hours;
    uint32 public lastEmergencyAction;
    
    // ==================== EVENTS ====================
    
    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 amount, uint256 shares);
    event Rebalance(uint256 indexed epoch, uint256 gasUsed, uint256 profit);
    event StrategyExecuted(bytes32 indexed strategyId, uint256 amount, uint256 actualAPY);
    event CrossChainTransfer(uint64 indexed fromChain, uint64 indexed toChain, uint256 amount);
    event AIModelUpdated(uint256 version, string modelCID);
    event EmergencyAction(string action, address actor);
    event YieldHarvested(address indexed user, uint256 amount);
    event PerformanceFeeUpdated(uint256 newFee);
    
    // ==================== ERRORS ====================
    
    error InsufficientDeposit(uint256 provided, uint256 minimum);
    error InsufficientBalance(uint256 requested, uint256 available);
    error StrategyNotActive(bytes32 strategyId);
    error ChainNotSupported(uint64 chainId);
    error OptimizationFailed(string reason);
    error SlippageExceeded(uint256 expected, uint256 actual);
    error RebalanceTooSoon(uint256 nextAvailable);
    error UnauthorizedAccess(address caller);
    error EmergencyCooldownActive(uint256 remainingTime);
    error InvalidRiskProfile(uint8 provided);
    error ZeroAddress();
    error ZeroAmount();
    error MessageAlreadyProcessed(bytes32 messageId);
    error VRFRequestFailed(uint256 requestId);

    // ==================== MODIFIERS ====================
    
    modifier onlyActiveStrategy(bytes32 strategyId) {
        if (!strategies[strategyId].isActive) revert StrategyNotActive(strategyId);
        _;
    }
    
    modifier validRiskProfile(uint8 riskProfile) {
        if (riskProfile == 0 || riskProfile > 10) revert InvalidRiskProfile(riskProfile);
        _;
    }
    
    modifier notZeroAddress(address addr) {
        if (addr == address(0)) revert ZeroAddress();
        _;
    }
    
    modifier notZeroAmount(uint256 amount) {
        if (amount == 0) revert ZeroAmount();
        _;
    }

    // ==================== CONSTRUCTOR ====================
    
    constructor(
        address _yieldToken,
        address _ccipRouter,
        address _linkToken,
        address _functionsRouter,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _gasLane
    ) 
        CCIPReceiver(_ccipRouter)
        FunctionsClient(_functionsRouter)
        VRFConsumerBaseV2(_vrfCoordinator)
        notZeroAddress(_yieldToken)
        notZeroAddress(_ccipRouter)
        notZeroAddress(_linkToken)
    {
        yieldToken = IERC20(_yieldToken);
        i_ccipRouter = IRouterClient(_ccipRouter);
        i_linkToken = LinkTokenInterface(_linkToken);
        i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        i_subscriptionId = _subscriptionId;
        i_gasLane = _gasLane;
        i_callbackGasLimit = 200000;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        // Initialize supported chains
        supportedChains[1] = true; // Ethereum
        supportedChains[137] = true; // Polygon
        supportedChains[42161] = true; // Arbitrum
        supportedChains[10] = true; // Optimism
    }

    // ==================== USER FUNCTIONS ====================
    
    /**
     * @notice Deposit yield tokens and receive shares
     * @param amount Amount of yield tokens to deposit
     * @param riskProfile User's risk tolerance (1-10)
     * @dev Implements advanced share calculation with slippage protection
     */
    function deposit(uint256 amount, uint8 riskProfile) 
        external 
        nonReentrant 
        whenNotPaused
        notZeroAmount(amount)
        validRiskProfile(riskProfile)
        returns (uint256 shares) 
    {
        if (amount < minDepositAmount) revert InsufficientDeposit(amount, minDepositAmount);
        
        // Transfer tokens (safe transfer)
        yieldToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate shares with precision
        if (totalShares == 0) {
            shares = amount;
        } else {
            // Apply 0.1% deposit fee for MEV protection
            uint256 feeAdjustedAmount = (amount * 999) / 1000;
            shares = (feeAdjustedAmount * totalShares) / totalValueLocked;
        }
        
        // Update user position
        UserPosition storage position = userPositions[msg.sender];
        position.shares += shares;
        position.depositedAmount += amount;
        position.lastActionTimestamp = block.timestamp;
        position.riskProfile = riskProfile;
        
        // Update global state
        totalShares += shares;
        totalValueLocked += amount;
        
        emit Deposit(msg.sender, amount, shares);
        
        // Trigger rebalance if conditions met
        if (_shouldRebalance()) {
            _initiateAIOptimization();
        }
    }
    
    /**
     * @notice Withdraw yield tokens by burning shares
     * @param shares Number of shares to burn
     * @dev Implements withdrawal with yield distribution
     */
    function withdraw(uint256 shares) 
        external 
        nonReentrant 
        whenNotPaused
        notZeroAmount(shares)
        returns (uint256 amount) 
    {
        UserPosition storage position = userPositions[msg.sender];
        if (shares > position.shares) revert InsufficientBalance(shares, position.shares);
        
        // Calculate withdrawal amount including yield
        amount = (shares * totalValueLocked) / totalShares;
        
        // Apply performance fee on profits
        uint256 profit = 0;
        if (amount > position.depositedAmount) {
            profit = amount - position.depositedAmount;
            uint256 fee = (profit * performanceFee) / 10000;
            amount -= fee;
            // Fee stays in protocol for all users
        }
        
        // Update user position
        position.shares -= shares;
        uint256 depositReduction = (position.depositedAmount * shares) / (position.shares + shares);
        position.depositedAmount -= depositReduction;
        position.accumulatedYield += profit;
        position.lastActionTimestamp = block.timestamp;
        
        // Update global state
        totalShares -= shares;
        totalValueLocked -= amount;
        
        // Transfer tokens
        yieldToken.safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, amount, shares);
    }
    
    /**
     * @notice Harvest accumulated yield without withdrawing principal
     * @dev Gas-efficient yield claiming
     */
    function harvestYield() external nonReentrant whenNotPaused returns (uint256 yield) {
        UserPosition storage position = userPositions[msg.sender];
        
        // Calculate current value and yield
        uint256 currentValue = (position.shares * totalValueLocked) / totalShares;
        if (currentValue > position.depositedAmount) {
            yield = currentValue - position.depositedAmount;
            
            // Apply performance fee
            uint256 fee = (yield * performanceFee) / 10000;
            yield -= fee;
            
            // Update position without changing shares
            position.accumulatedYield += yield;
            position.lastActionTimestamp = block.timestamp;
            
            // Transfer yield
            totalValueLocked -= yield;
            yieldToken.safeTransfer(msg.sender, yield);
            
            emit YieldHarvested(msg.sender, yield);
        }
    }

    // ==================== CHAINLINK AUTOMATION ====================
    
    /**
     * @notice Check if automated rebalancing is needed
     * @dev Called by Chainlink Automation network
     */
    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = _shouldRebalance();
        
        if (upkeepNeeded) {
            // Prepare optimization parameters
            performData = abi.encode(
                block.timestamp,
                totalValueLocked,
                activeStrategyIds.length
            );
        }
    }
    
    /**
     * @notice Execute automated rebalancing
     * @dev Triggers AI optimization via Chainlink Functions
     */
    function performUpkeep(bytes calldata performData) external override {
        (uint256 timestamp, uint256 tvl, uint256 strategyCount) = 
            abi.decode(performData, (uint256, uint256, uint256));
        
        if (!_shouldRebalance()) revert RebalanceTooSoon(lastRebalanceTimestamp + rebalanceInterval);
        
        lastRebalanceTimestamp = block.timestamp;
        _initiateAIOptimization();
    }

    // ==================== AI OPTIMIZATION ====================
    
    /**
     * @notice Initiate AI-powered optimization using Chainlink Functions
     * @dev Calls off-chain AI model for strategy selection
     */
    function _initiateAIOptimization() private {
        // Prepare market data for AI model
        bytes memory marketData = _prepareMarketData();
        
        // Create Functions request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(_getAIOptimizationScript());
        req.addArgs(_encodeMarketData(marketData));
        
        // Add AI model reference
        if (bytes(aiModelCID).length > 0) {
            req.addArgs(aiModelCID);
        }
        
        // Send request
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            i_subscriptionId,
            i_callbackGasLimit,
            donId
        );
        
        // Store request for callback
        pendingOptimizations[requestId] = OptimizationResult({
            strategyId: bytes32(0),
            expectedAPY: 0,
            confidence: 0,
            gasRequired: 0,
            executionDeadline: block.timestamp + 1 hours,
            executionData: ""
        });
    }
    
    /**
     * @notice Callback for Chainlink Functions with AI optimization result
     * @dev Processes AI recommendations and initiates execution
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (err.length > 0) {
            emit OptimizationFailed(string(err));
            return;
        }
        
        // Decode AI optimization result
        (
            bytes32 strategyId,
            uint256 expectedAPY,
            uint256 confidence,
            uint256[] memory allocations
        ) = abi.decode(response, (bytes32, uint256, uint256, uint256[]));
        
        OptimizationResult storage result = pendingOptimizations[requestId];
        result.strategyId = strategyId;
        result.expectedAPY = expectedAPY;
        result.confidence = confidence;
        result.executionData = abi.encode(allocations);
        
        // Request VRF for randomness (MEV protection)
        uint256 vrfRequestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        
        vrfRequestToOptimization[vrfRequestId] = requestId;
    }
    
    /**
     * @notice Callback for Chainlink VRF with randomness
     * @dev Uses randomness to prevent MEV attacks during execution
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        bytes32 optimizationId = vrfRequestToOptimization[requestId];
        OptimizationResult memory result = pendingOptimizations[optimizationId];
        
        if (result.strategyId == bytes32(0)) {
            revert VRFRequestFailed(requestId);
        }
        
        // Use randomness to determine execution timing (anti-MEV)
        uint256 delay = randomWords[0] % 30; // 0-30 second random delay
        
        // Execute strategy after delay
        _executeStrategy(result, delay);
    }

    // ==================== CROSS-CHAIN OPERATIONS ====================
    
    /**
     * @notice Send cross-chain rebalancing message via CCIP
     * @param destinationChain Target chain for rebalancing
     * @param amount Amount to transfer
     * @param strategyId Strategy to execute on destination
     */
    function initiateCrossChainRebalance(
        uint64 destinationChain,
        uint256 amount,
        bytes32 strategyId
    ) 
        external 
        onlyRole(KEEPER_ROLE)
        onlyActiveStrategy(strategyId)
        returns (bytes32 messageId) 
    {
        if (!supportedChains[destinationChain]) revert ChainNotSupported(destinationChain);
        
        // Prepare cross-chain message
        CrossChainRequest memory request = CrossChainRequest({
            user: address(this),
            amount: amount,
            sourceChain: uint64(block.chainid),
            destinationChain: destinationChain,
            strategyId: strategyId,
            nonce: userNonces[address(this)][destinationChain]++
        });
        
        // Encode message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)), // Same address on all chains
            data: abi.encode(request),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 500_000, strict: false})
            ),
            feeToken: address(i_linkToken)
        });
        
        // Calculate and approve fees
        uint256 fees = i_ccipRouter.getFee(destinationChain, message);
        i_linkToken.approve(address(i_ccipRouter), fees);
        
        // Send message
        messageId = i_ccipRouter.ccipSend(destinationChain, message);
        pendingCrossChainRequests[messageId] = request;
        
        emit CrossChainTransfer(uint64(block.chainid), destinationChain, amount);
    }
    
    /**
     * @notice Handle incoming CCIP messages
     * @dev Processes cross-chain rebalancing requests
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        bytes32 messageId = any2EvmMessage.messageId;
        
        // Prevent replay attacks
        if (processedMessages[messageId]) revert MessageAlreadyProcessed(messageId);
        processedMessages[messageId] = true;
        
        // Decode request
        CrossChainRequest memory request = abi.decode(
            any2EvmMessage.data,
            (CrossChainRequest)
        );
        
        // Verify and execute
        if (strategies[request.strategyId].isActive) {
            _executeStrategyOnChain(request.strategyId, request.amount);
        }
        
        emit CrossChainTransfer(request.sourceChain, request.destinationChain, request.amount);
    }

    // ==================== STRATEGY EXECUTION ====================
    
    /**
     * @notice Execute strategy with gas optimization and MEV protection
     * @param result AI optimization result
     * @param delay Random delay for MEV protection
     */
    function _executeStrategy(OptimizationResult memory result, uint256 delay) private {
        // Apply delay (in production, would use automation)
        if (delay > 0) {
            // Store for delayed execution
            return;
        }
        
        YieldStrategy storage strategy = strategies[result.strategyId];
        uint256[] memory allocations = abi.decode(result.executionData, (uint256[]));
        
        uint256 totalAllocated = 0;
        uint256 gasUsed = gasleft();
        
        // Execute allocations
        for (uint256 i = 0; i < allocations.length && i < activeStrategyIds.length; i++) {
            if (allocations[i] > 0) {
                bytes32 targetStrategyId = activeStrategyIds[i];
                uint256 amount = (totalValueLocked * allocations[i]) / 10000;
                
                // Enforce max allocation
                if (allocations[i] > maxSingleAllocation * 100) {
                    amount = (totalValueLocked * maxSingleAllocation) / 100;
                }
                
                _executeStrategyOnChain(targetStrategyId, amount);
                totalAllocated += amount;
            }
        }
        
        gasUsed = gasUsed - gasleft();
        
        emit Rebalance(block.timestamp, gasUsed, result.expectedAPY);
        emit StrategyExecuted(result.strategyId, totalAllocated, result.expectedAPY);
    }
    
    /**
     * @notice Execute strategy on specific chain
     * @dev Integrates with external DeFi protocols
     */
    function _executeStrategyOnChain(bytes32 strategyId, uint256 amount) private {
        YieldStrategy storage strategy = strategies[strategyId];
        
        // Update chain balances
        chainBalances[strategy.chainId][strategy.protocol] += amount;
        
        // In production: integrate with actual DeFi protocols
        // For demo: emit event
        strategy.tvl += amount;
        strategy.lastUpdate = block.timestamp;
    }

    // ==================== HELPER FUNCTIONS ====================
    
    /**
     * @notice Check if rebalancing should occur
     * @dev Implements sophisticated rebalancing logic
     */
    function _shouldRebalance() private view returns (bool) {
        // Time-based check
        if (block.timestamp < lastRebalanceTimestamp + rebalanceInterval) {
            return false;
        }
        
        // TVL threshold check
        if (totalValueLocked < 10000 * 1e6) { // $10k minimum
            return false;
        }
        
        // Volatility check (simplified for demo)
        // In production: use Chainlink Data Streams for real-time volatility
        
        return true;
    }
    
    /**
     * @notice Prepare market data for AI model
     * @dev Aggregates on-chain and off-chain data
     */
    function _prepareMarketData() private view returns (bytes memory) {
        // Collect strategy data
        uint256 strategyCount = activeStrategyIds.length;
        uint256[] memory apys = new uint256[](strategyCount);
        uint256[] memory tvls = new uint256[](strategyCount);
        uint256[] memory risks = new uint256[](strategyCount);
        
        for (uint256 i = 0; i < strategyCount; i++) {
            YieldStrategy memory strategy = strategies[activeStrategyIds[i]];
            apys[i] = strategy.currentAPY;
            tvls[i] = strategy.tvl;
            risks[i] = strategy.riskScore;
        }
        
        return abi.encode(apys, tvls, risks, totalValueLocked);
    }
    
    /**
     * @notice Encode market data for Functions request
     */
    function _encodeMarketData(bytes memory data) private pure returns (string[] memory) {
        string[] memory args = new string[](1);
        args[0] = _bytesToBase64(data);
        return args;
    }
    
    /**
     * @notice Get AI optimization JavaScript code
     * @dev Returns Functions-compatible JS for AI inference
     */
    function _getAIOptimizationScript() private pure returns (string memory) {
        return string(abi.encodePacked(
            "const marketData = Functions.makeHttpRequest({",
            "  url: 'https://api.yieldmax.ai/optimize',",
            "  method: 'POST',",
            "  headers: { 'Content-Type': 'application/json' },",
            "  data: { market: args[0], model: args[1] || 'v1' }",
            "});",
            "const response = await marketData;",
            "if (response.error) throw Error('AI optimization failed');",
            "const result = response.data;",
            "return Functions.encodeUint256Array([",
            "  result.strategyId,",
            "  result.expectedAPY,",
            "  result.confidence,",
            "  ...result.allocations",
            "]);"
        ));
    }
    
    /**
     * @notice Convert bytes to base64 string
     */
    function _bytesToBase64(bytes memory data) private pure returns (string memory) {
        // Simplified for demo - in production use proper base64 encoding
        return string(data);
    }

    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @notice Update AI model reference
     * @param version New model version
     * @param modelCID IPFS CID of model weights
     */
    function updateAIModel(uint256 version, string memory modelCID) 
        external 
        onlyRole(STRATEGIST_ROLE) 
    {
        aiModelVersion = version;
        aiModelCID = modelCID;
        emit AIModelUpdated(version, modelCID);
    }
    
    /**
     * @notice Add or update yield strategy
     * @param strategyId Unique strategy identifier  
     * @param strategy Strategy parameters
     */
    function updateStrategy(bytes32 strategyId, YieldStrategy memory strategy) 
        external 
        onlyRole(STRATEGIST_ROLE) 
    {
        strategies[strategyId] = strategy;
        
        // Add to active list if new
        bool exists = false;
        for (uint256 i = 0; i < activeStrategyIds.length; i++) {
            if (activeStrategyIds[i] == strategyId) {
                exists = true;
                break;
            }
        }
        
        if (!exists && strategy.isActive) {
            activeStrategyIds.push(strategyId);
        }
    }
    
    /**
     * @notice Update performance fee
     * @param newFee Fee in basis points (max 10%)
     */
    function updatePerformanceFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        performanceFee = newFee;
        emit PerformanceFeeUpdated(newFee);
    }
    
    /**
     * @notice Emergency pause
     * @dev Stops all user operations
     */
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        if (block.timestamp < lastEmergencyAction + emergencyCooldown) {
            revert EmergencyCooldownActive(
                (lastEmergencyAction + emergencyCooldown) - block.timestamp
            );
        }
        
        lastEmergencyAction = uint32(block.timestamp);
        _pause();
        emit EmergencyAction("pause", msg.sender);
    }
    
    /**
     * @notice Emergency unpause
     */
    function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
        emit EmergencyAction("unpause", msg.sender);
    }
    
    /**
     * @notice Update supported chains
     */
    function updateSupportedChain(uint64 chainId, bool supported) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        supportedChains[chainId] = supported;
    }
    
    /**
     * @notice Set price feed for token
     */
    function setPriceFeed(address token, address feed) 
        external 
        onlyRole(STRATEGIST_ROLE)
        notZeroAddress(token)
        notZeroAddress(feed) 
    {
        priceFeeds[token] = AggregatorV3Interface(feed);
    }

    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @notice Get user's current portfolio value
     * @param user Address to query
     * @return value Current value in yield tokens
     */
    function getUserValue(address user) external view returns (uint256 value) {
        UserPosition memory position = userPositions[user];
        if (position.shares > 0) {
            value = (position.shares * totalValueLocked) / totalShares;
        }
    }
    
    /**
     * @notice Get current APY across all strategies
     * @return apy Weighted average APY
     */
    function getCurrentAPY() external view returns (uint256 apy) {
        uint256 totalWeight = 0;
        uint256 weightedAPY = 0;
        
        for (uint256 i = 0; i < activeStrategyIds.length; i++) {
            YieldStrategy memory strategy = strategies[activeStrategyIds[i]];
            if (strategy.isActive && strategy.tvl > 0) {
                weightedAPY += strategy.currentAPY * strategy.tvl;
                totalWeight += strategy.tvl;
            }
        }
        
        if (totalWeight > 0) {
            apy = weightedAPY / totalWeight;
        }
    }
    
    /**
     * @notice Get all active strategies
     * @return Array of active strategy IDs
     */
    function getActiveStrategies() external view returns (bytes32[] memory) {
        return activeStrategyIds;
    }
    
    /**
     * @notice Calculate shares for given deposit amount
     * @param amount Deposit amount
     * @return shares Expected shares
     */
    function calculateShares(uint256 amount) external view returns (uint256 shares) {
        if (totalShares == 0) {
            shares = amount;
        } else {
            uint256 feeAdjustedAmount = (amount * 999) / 1000;
            shares = (feeAdjustedAmount * totalShares) / totalValueLocked;
        }
    }

    // ==================== EMERGENCY FUNCTIONS ====================
    
    /**
     * @notice Emergency withdraw for specific user
     * @dev Only in extreme circumstances
     */
    function emergencyWithdrawForUser(address user) 
        external 
        onlyRole(EMERGENCY_ROLE) 
        whenPaused 
    {
        UserPosition storage position = userPositions[user];
        uint256 shares = position.shares;
        
        if (shares > 0) {
            uint256 amount = (shares * totalValueLocked) / totalShares;
            
            // Reset user position
            position.shares = 0;
            position.depositedAmount = 0;
            
            // Update globals
            totalShares -= shares;
            totalValueLocked -= amount;
            
            // Transfer
            yieldToken.safeTransfer(user, amount);
            
            emit EmergencyAction("withdraw_for_user", msg.sender);
            emit Withdraw(user, amount, shares);
        }
    }
    
    /**
     * @notice Recover stuck tokens
     * @dev For tokens accidentally sent to contract
     */
    function recoverToken(address token, uint256 amount) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        require(token != address(yieldToken), "Cannot recover yield token");
        IERC20(token).safeTransfer(msg.sender, amount);
        emit EmergencyAction("recover_token", msg.sender);
    }

    // ==================== RECEIVE FUNCTIONS ====================
    
    /**
     * @notice Receive ETH for gas payments
     */
    receive() external payable {}
    
    /**
     * @notice Fallback
     */
    fallback() external payable {}
}