// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// CCIP Interfaces
interface IRouterClient {
    struct EVM2AnyMessage {
        bytes receiver;
        bytes data;
        EVMTokenAmount[] tokenAmounts;
        address feeToken;
        bytes extraArgs;
    }

    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }

    function ccipSend(
        uint64 destinationChainSelector,
        EVM2AnyMessage calldata message
    ) external payable returns (bytes32);

    function getFee(
        uint64 destinationChainSelector,
        EVM2AnyMessage calldata message
    ) external view returns (uint256);
}

interface IAny2EVMMessageReceiver {
    struct Any2EVMMessage {
        bytes32 messageId;
        uint64 sourceChainSelector;
        bytes sender;
        bytes data;
        EVMTokenAmount[] tokenAmounts;
    }

    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }
}

/**
 * @title CrossChainRouter
 * @notice Handles cross-chain yield optimization using Chainlink CCIP
 * @dev Enables moving funds between chains to chase best yields
 */
contract CrossChainRouter is Ownable, IAny2EVMMessageReceiver {
    // ==================== STRUCTS ====================
    struct ChainConfig {
        uint64 chainSelector;
        address vault;
        address strategyEngine;
        bool active;
    }
    
    struct CrossChainRebalance {
        uint256 timestamp;
        uint64 fromChain;
        uint64 toChain;
        uint256 amount;
        uint256 expectedYield;
        bytes32 messageId;
        bool completed;
    }
    
    struct ChainYieldInfo {
        uint64 chainSelector;
        uint256 bestApy;
        address bestProtocol;
        uint256 tvl;
        uint256 lastUpdate;
    }
    
    // ==================== STATE VARIABLES ====================
    IRouterClient public immutable ccipRouter;
    address public immutable linkToken;
    
    mapping(uint64 => ChainConfig) public chainConfigs;
    mapping(bytes32 => CrossChainRebalance) public rebalances;
    mapping(uint64 => ChainYieldInfo) public chainYields;
    
    uint64[] public supportedChains;
    CrossChainRebalance[] public rebalanceHistory;
    
    uint256 public minYieldDifferential = 200; // 2% minimum to trigger cross-chain
    uint256 public maxSlippage = 50; // 0.5% max slippage
    
    // Chain selectors
    uint64 public constant SEPOLIA_CHAIN_SELECTOR = 16015286601757825753;
    uint64 public constant ARBITRUM_SEPOLIA_CHAIN_SELECTOR = 3478487238524512106;
    uint64 public constant OPTIMISM_SEPOLIA_CHAIN_SELECTOR = 5224473277236331295;
    uint64 public constant POLYGON_AMOY_CHAIN_SELECTOR = 16281711391670634445;
    
    // ==================== EVENTS ====================
    event CrossChainRebalanceInitiated(
        uint64 indexed fromChain,
        uint64 indexed toChain,
        uint256 amount,
        bytes32 messageId
    );
    
    event CrossChainRebalanceCompleted(
        bytes32 indexed messageId,
        uint64 fromChain,
        uint64 toChain,
        uint256 amount
    );
    
    event YieldDataUpdated(uint64 indexed chain, uint256 apy, address protocol);
    event ChainConfigured(uint64 indexed chain, address vault, address strategy);
    
    // ==================== MODIFIERS ====================
    modifier onlyRouter() {
        require(msg.sender == address(ccipRouter), "Only CCIP router");
        _;
    }
    
    modifier onlyActiveChain(uint64 chainSelector) {
        require(chainConfigs[chainSelector].active, "Chain not active");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    constructor(address _ccipRouter, address _linkToken) Ownable(msg.sender) {
        ccipRouter = IRouterClient(_ccipRouter);
        linkToken = _linkToken;
        
        // Initialize with current chain
        _initializeCurrentChain();
    }
    
    // ==================== EXTERNAL FUNCTIONS ====================
    
    /**
     * @notice Configure a supported chain
     */
    function configureChain(
        uint64 chainSelector,
        address vault,
        address strategyEngine
    ) external onlyOwner {
        require(vault != address(0) && strategyEngine != address(0), "Invalid addresses");
        
        if (!chainConfigs[chainSelector].active) {
            supportedChains.push(chainSelector);
        }
        
        chainConfigs[chainSelector] = ChainConfig({
            chainSelector: chainSelector,
            vault: vault,
            strategyEngine: strategyEngine,
            active: true
        });
        
        emit ChainConfigured(chainSelector, vault, strategyEngine);
    }
    
    /**
     * @notice Update yield data for a chain
     */
    function updateChainYield(
        uint64 chainSelector,
        uint256 bestApy,
        address bestProtocol,
        uint256 tvl
    ) external onlyOwner onlyActiveChain(chainSelector) {
        chainYields[chainSelector] = ChainYieldInfo({
            chainSelector: chainSelector,
            bestApy: bestApy,
            bestProtocol: bestProtocol,
            tvl: tvl,
            lastUpdate: block.timestamp
        });
        
        emit YieldDataUpdated(chainSelector, bestApy, bestProtocol);
    }
    
    /**
     * @notice Find best cross-chain opportunity
     */
    function findBestCrossChainOpportunity(uint256 amount) 
        external 
        view 
        returns (
            uint64 currentChain,
            uint64 targetChain,
            uint256 currentApy,
            uint256 targetApy,
            uint256 yieldImprovement
        ) 
    {
        currentChain = _getCurrentChainSelector();
        ChainYieldInfo memory currentYield = chainYields[currentChain];
        
        uint256 bestApy = currentYield.bestApy;
        uint64 bestChain = currentChain;
        
        for (uint256 i = 0; i < supportedChains.length; i++) {
            uint64 chain = supportedChains[i];
            if (chain == currentChain || !chainConfigs[chain].active) continue;
            
            ChainYieldInfo memory chainYield = chainYields[chain];
            
            // Check if this chain has better yield and enough liquidity
            if (chainYield.bestApy > bestApy && chainYield.tvl >= amount * 10) {
                bestApy = chainYield.bestApy;
                bestChain = chain;
            }
        }
        
        targetChain = bestChain;
        currentApy = currentYield.bestApy;
        targetApy = bestApy;
        yieldImprovement = targetApy > currentApy ? targetApy - currentApy : 0;
    }
    
    /**
     * @notice Initiate cross-chain rebalance
     */
    function initiateCrossChainRebalance(
        uint64 targetChain,
        uint256 amount,
        address token
    ) external payable onlyOwner onlyActiveChain(targetChain) returns (bytes32) {
        require(amount > 0, "Invalid amount");
        
        // Get current chain info
        uint64 currentChain = _getCurrentChainSelector();
        require(targetChain != currentChain, "Same chain");
        
        // Verify yield improvement
        require(
            chainYields[targetChain].bestApy >= chainYields[currentChain].bestApy + minYieldDifferential,
            "Insufficient yield improvement"
        );
        
        // Create and send CCIP message
        bytes32 messageId = _sendCrossChainMessage(targetChain, amount, token);
        
        // Record rebalance
        _recordRebalance(messageId, currentChain, targetChain, amount);
        
        emit CrossChainRebalanceInitiated(currentChain, targetChain, amount, messageId);
        
        return messageId;
    }
    
    /**
     * @notice Send cross-chain message
     */
    function _sendCrossChainMessage(
        uint64 targetChain,
        uint256 amount,
        address token
    ) private returns (bytes32) {
        ChainConfig memory targetConfig = chainConfigs[targetChain];
        ChainYieldInfo memory targetYield = chainYields[targetChain];
        
        bytes memory data = abi.encode(
            msg.sender,
            targetConfig.vault,
            targetYield.bestProtocol,
            targetYield.bestApy
        );
        
        IRouterClient.EVMTokenAmount[] memory tokenAmounts = new IRouterClient.EVMTokenAmount[](1);
        tokenAmounts[0] = IRouterClient.EVMTokenAmount({
            token: token,
            amount: amount
        });
        
        IRouterClient.EVM2AnyMessage memory message = IRouterClient.EVM2AnyMessage({
            receiver: abi.encode(address(this)),
            data: data,
            tokenAmounts: tokenAmounts,
            feeToken: linkToken,
            extraArgs: ""
        });
        
        uint256 fee = ccipRouter.getFee(targetChain, message);
        
        IERC20(token).approve(address(ccipRouter), amount);
        IERC20(linkToken).approve(address(ccipRouter), fee);
        
        return ccipRouter.ccipSend(targetChain, message);
    }
    
    /**
     * @notice Record rebalance
     */
    function _recordRebalance(
        bytes32 messageId,
        uint64 fromChain,
        uint64 toChain,
        uint256 amount
    ) private {
        CrossChainRebalance memory rebalance = CrossChainRebalance({
            timestamp: block.timestamp,
            fromChain: fromChain,
            toChain: toChain,
            amount: amount,
            expectedYield: chainYields[toChain].bestApy,
            messageId: messageId,
            completed: false
        });
        
        rebalances[messageId] = rebalance;
        rebalanceHistory.push(rebalance);
    }
    
    /**
     * @notice Handle incoming CCIP message
     */
    function ccipReceive(Any2EVMMessage calldata message) 
        external 
        onlyRouter 
    {
        // Decode message
        (
            address originalSender,
            address targetVault,
            address targetProtocol,
            uint256 expectedYield
        ) = abi.decode(message.data, (address, address, address, uint256));
        
        // Process tokens
        require(message.tokenAmounts.length == 1, "Invalid token transfer");
        
        address token = message.tokenAmounts[0].token;
        uint256 amount = message.tokenAmounts[0].amount;
        
        // Deposit to target vault
        IERC20(token).approve(targetVault, amount);
        // In production, would call vault.deposit(amount, originalSender)
        
        // Update rebalance status
        if (rebalances[message.messageId].amount > 0) {
            rebalances[message.messageId].completed = true;
        }
        
        emit CrossChainRebalanceCompleted(
            message.messageId,
            message.sourceChainSelector,
            _getCurrentChainSelector(),
            amount
        );
    }
    
    /**
     * @notice Get cross-chain statistics
     */
    function getCrossChainStats() external view returns (
        uint256 totalRebalances,
        uint256 totalVolumeRebalanced,
        uint64[] memory chains,
        uint256[] memory chainApys
    ) {
        totalRebalances = rebalanceHistory.length;
        
        for (uint256 i = 0; i < rebalanceHistory.length; i++) {
            if (rebalanceHistory[i].completed) {
                totalVolumeRebalanced += rebalanceHistory[i].amount;
            }
        }
        
        chains = supportedChains;
        chainApys = new uint256[](supportedChains.length);
        
        for (uint256 i = 0; i < supportedChains.length; i++) {
            chainApys[i] = chainYields[supportedChains[i]].bestApy;
        }
    }
    
    /**
     * @notice Get rebalance history
     */
    function getRebalanceHistory(uint256 limit) 
        external 
        view 
        returns (CrossChainRebalance[] memory) 
    {
        uint256 length = rebalanceHistory.length;
        if (limit > length) limit = length;
        
        CrossChainRebalance[] memory recent = new CrossChainRebalance[](limit);
        for (uint256 i = 0; i < limit; i++) {
            recent[i] = rebalanceHistory[length - limit + i];
        }
        
        return recent;
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @notice Get current chain selector
     */
    function _getCurrentChainSelector() private view returns (uint64) {
        uint256 chainId = block.chainid;
        
        if (chainId == 11155111) return SEPOLIA_CHAIN_SELECTOR;
        if (chainId == 421614) return ARBITRUM_SEPOLIA_CHAIN_SELECTOR;
        if (chainId == 11155420) return OPTIMISM_SEPOLIA_CHAIN_SELECTOR;
        if (chainId == 80002) return POLYGON_AMOY_CHAIN_SELECTOR;
        
        revert("Unsupported chain");
    }
    
    /**
     * @notice Initialize current chain configuration
     */
    function _initializeCurrentChain() private {
        uint64 currentChain = _getCurrentChainSelector();
        
        // Set mock configuration for current chain
        chainConfigs[currentChain] = ChainConfig({
            chainSelector: currentChain,
            vault: address(0), // Will be set later
            strategyEngine: address(0), // Will be set later
            active: true
        });
        
        supportedChains.push(currentChain);
    }
}