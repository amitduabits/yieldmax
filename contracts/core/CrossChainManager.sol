/*
// contracts/core/CrossChainManager.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ICCIPRouter {
    function ccipSend(uint64 destinationChainId, bytes calldata message) external returns (bytes32);
}

contract CrossChainManager is Ownable, ReentrancyGuard {
    ICCIPRouter public ccipRouter;
    
    struct CrossChainMessage {
        address sender;
        uint256 amount;
        address targetProtocol;
        uint64 targetChain;
        bytes data;
    }
    
    mapping(bytes32 => bool) public processedMessages;
    mapping(uint64 => bool) public supportedChains;
    
    event CrossChainTransferInitiated(
        bytes32 messageId,
        address sender,
        uint64 targetChain,
        uint256 amount
    );
    
    event CrossChainTransferCompleted(
        bytes32 messageId,
        uint64 sourceChain,
        uint256 amount
    );
    
    constructor(address _ccipRouter) {
        ccipRouter = ICCIPRouter(_ccipRouter);
        
        // Initialize supported chains
        supportedChains[1] = true; // Ethereum
        supportedChains[42161] = true; // Arbitrum
        supportedChains[137] = true; // Polygon
        supportedChains[10] = true; // Optimism
    }
    
    function initiateCrossChainTransfer(
        uint64 targetChain,
        address targetProtocol,
        uint256 amount,
        bytes calldata data
    ) external nonReentrant returns (bytes32 messageId) {
        require(supportedChains[targetChain], "Chain not supported");
        require(amount > 0, "Invalid amount");
        
        CrossChainMessage memory message = CrossChainMessage({
            sender: msg.sender,
            amount: amount,
            targetProtocol: targetProtocol,
            targetChain: targetChain,
            data: data
        });
        
        bytes memory encodedMessage = abi.encode(message);
        messageId = ccipRouter.ccipSend(targetChain, encodedMessage);
        
        emit CrossChainTransferInitiated(messageId, msg.sender, targetChain, amount);
        
        return messageId;
    }
    
    function processCrossChainMessage(
        bytes32 messageId,
        uint64 sourceChain,
        bytes calldata encodedMessage
    ) external {
        require(msg.sender == address(ccipRouter), "Only CCIP router");
        require(!processedMessages[messageId], "Already processed");
        
        processedMessages[messageId] = true;
        
        CrossChainMessage memory message = abi.decode(
            encodedMessage,
            (CrossChainMessage)
        );
        
        // Process the cross-chain transfer
        _executeCrossChainTransfer(message);
        
        emit CrossChainTransferCompleted(messageId, sourceChain, message.amount);
    }
    
    function _executeCrossChainTransfer(CrossChainMessage memory message) internal {
        // Implementation for executing the transfer on target chain
        // This would interact with the target protocol
    }
}

// contracts/ai/AIOptimizer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IChainlinkFunctions {
    function sendRequest(
        string memory source,
        bytes memory secrets,
        string[] memory args,
        uint64 subscriptionId,
        uint32 gasLimit
    ) external returns (bytes32);
}

contract AIOptimizer is Ownable {
    IChainlinkFunctions public chainlinkFunctions;
    
    struct OptimizationStrategy {
        address fromProtocol;
        address toProtocol;
        uint256 amount;
        uint256 expectedAPY;
        uint256 confidence;
        uint256 timestamp;
    }
    
    struct UserProfile {
        uint256 riskTolerance; // 0-100
        bool isPremium;
        uint256 totalOptimizations;
        uint256 totalProfitGenerated;
    }
    
    mapping(address => OptimizationStrategy) public currentStrategies;
    mapping(address => UserProfile) public userProfiles;
    mapping(bytes32 => address) public pendingRequests;
    
    uint64 public subscriptionId;
    string public aiModelSource; // JavaScript code for Chainlink Functions
    
    event OptimizationRequested(address user, bytes32 requestId);
    event OptimizationReceived(address user, OptimizationStrategy strategy);
    
    constructor(address _chainlinkFunctions, uint64 _subscriptionId) {
        chainlinkFunctions = IChainlinkFunctions(_chainlinkFunctions);
        subscriptionId = _subscriptionId;
        
        // Set the AI model source code
        aiModelSource = "const userAddress = args[0]; const amount = args[1]; const riskProfile = args[2]; /* AI logic here */ return Functions.encodeString(JSON.stringify(result));";
    }
    
    function requestOptimization(
        uint256 amount,
        uint256 currentAPY
    ) external returns (bytes32 requestId) {
        string[] memory args = new string[](4);
        args[0] = addressToString(msg.sender);
        args[1] = uint256ToString(amount);
        args[2] = uint256ToString(userProfiles[msg.sender].riskTolerance);
        args[3] = uint256ToString(currentAPY);
        
        requestId = chainlinkFunctions.sendRequest(
            aiModelSource,
            "",  // No secrets needed
            args,
            subscriptionId,
            300000 // Gas limit
        );
        
        pendingRequests[requestId] = msg.sender;
        emit OptimizationRequested(msg.sender, requestId);
        
        return requestId;
    }
    
    function fulfillOptimization(
        bytes32 requestId,
        bytes memory response
    ) external {
        require(msg.sender == address(chainlinkFunctions), "Only Chainlink");
        
        address user = pendingRequests[requestId];
        require(user != address(0), "Invalid request");
        
        // Decode AI response
        OptimizationStrategy memory strategy = _decodeAIResponse(response);
        strategy.timestamp = block.timestamp;
        
        currentStrategies[user] = strategy;
        userProfiles[user].totalOptimizations++;
        
        emit OptimizationReceived(user, strategy);
        
        delete pendingRequests[requestId];
    }
    
    function _decodeAIResponse(bytes memory response) internal pure returns (OptimizationStrategy memory) {
        // Decode the AI response into a strategy
        // This is simplified - real implementation would parse JSON
        return OptimizationStrategy({
            fromProtocol: address(0x1234567890123456789012345678901234567890),
            toProtocol: address(0x0987654321098765432109876543210987654321),
            amount: 10000 * 1e6, // 10k USDC
            expectedAPY: 2150, // 21.50%
            confidence: 94,
            timestamp: 0
        });
    }
    
    function updateUserProfile(
        address user,
        uint256 riskTolerance,
        bool isPremium
    ) external onlyOwner {
        userProfiles[user].riskTolerance = riskTolerance;
        userProfiles[user].isPremium = isPremium;
    }
    
    // Helper functions
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
    
    function uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

// contracts/chainlink/AutomationHandler.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "../interfaces/IYieldMaxVault.sol";
import "../interfaces/IStrategyEngine.sol";

contract AutomationHandler is AutomationCompatibleInterface {
    IYieldMaxVault public immutable vault;
    IStrategyEngine public immutable strategyEngine;
    
    uint256 public constant REBALANCE_THRESHOLD = 100; // 1% in basis points
    uint256 public constant MIN_TIME_BETWEEN_CHECKS = 3600; // 1 hour
    
    uint256 public lastCheckTime;
    uint256 public totalRebalances;
    uint256 public totalProfitGenerated;
    
    event AutomatedRebalance(
        uint256 timestamp,
        uint256 profitGenerated,
        uint256 gasCost
    );
    
    constructor(address _vault, address _strategyEngine) {
        vault = IYieldMaxVault(_vault);
        strategyEngine = IStrategyEngine(_strategyEngine);
        lastCheckTime = block.timestamp;
    }
    
    function checkUpkeep(bytes calldata checkData)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // Check if enough time has passed
        if (block.timestamp < lastCheckTime + MIN_TIME_BETWEEN_CHECKS) {
            return (false, "");
        }
        
        // Get current positions
        (uint256 currentAPY, uint256 optimalAPY) = strategyEngine.getYieldComparison();
        
        // Calculate improvement potential
        uint256 improvement = optimalAPY > currentAPY ? 
            ((optimalAPY - currentAPY) * 10000) / currentAPY : 0;
        
        upkeepNeeded = improvement >= REBALANCE_THRESHOLD;
        performData = abi.encode(currentAPY, optimalAPY);
        
        return (upkeepNeeded, performData);
    }
    
    function performUpkeep(bytes calldata performData) external override {
        lastCheckTime = block.timestamp;
        
        (uint256 currentAPY, uint256 optimalAPY) = abi.decode(
            performData,
            (uint256, uint256)
        );
        
        uint256 gasBefore = gasleft();
        
        // Execute rebalance
        uint256 profitGenerated = strategyEngine.executeOptimalStrategy();
        
        uint256 gasUsed = gasBefore - gasleft();
        
        totalRebalances++;
        totalProfitGenerated += profitGenerated;
        
        emit AutomatedRebalance(
            block.timestamp,
            profitGenerated,
            gasUsed
        );
    }
    
    function getAutomationStats() external view returns (
        uint256 rebalances,
        uint256 profit,
        uint256 avgProfit
    ) {
        rebalances = totalRebalances;
        profit = totalProfitGenerated;
        avgProfit = totalRebalances > 0 ? profit / totalRebalances : 0;
    }
}

// contracts/chainlink/DataStreamConsumer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DataStreamConsumer is Ownable {
    struct ProtocolYield {
        uint256 apy;
        uint256 tvl;
        uint256 riskScore;
        uint256 lastUpdate;
        bool isActive;
    }
    
    struct ChainData {
        uint256 gasPrice;
        uint256 blockTime;
        bool isHealthy;
    }
    
    // Protocol => Chain => Yield Data
    mapping(address => mapping(uint256 => ProtocolYield)) public protocolYields;
    
    // Chain => Chain Data
    mapping(uint256 => ChainData) public chainData;
    
    // Price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds;
    
    address[] public trackedProtocols;
    uint256[] public supportedChains;
    
    event YieldUpdated(
        address indexed protocol,
        uint256 indexed chainId,
        uint256 apy,
        uint256 tvl
    );
    
    event ChainDataUpdated(
        uint256 indexed chainId,
        uint256 gasPrice,
        bool isHealthy
    );
    
    constructor() {
        // Initialize supported chains
        supportedChains.push(1); // Ethereum
        supportedChains.push(42161); // Arbitrum
        supportedChains.push(137); // Polygon
        supportedChains.push(10); // Optimism
        
        // Initialize price feeds (example addresses)
        priceFeeds[address(0)] = AggregatorV3Interface(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419); // ETH/USD
    }
    
    function updateYieldData(
        address protocol,
        uint256 chainId,
        uint256 apy,
        uint256 tvl,
        uint256 riskScore
    ) external onlyOwner {
        protocolYields[protocol][chainId] = ProtocolYield({
            apy: apy,
            tvl: tvl,
            riskScore: riskScore,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        emit YieldUpdated(protocol, chainId, apy, tvl);
    }
    
    function updateChainData(
        uint256 chainId,
        uint256 gasPrice,
        bool isHealthy
    ) external onlyOwner {
        chainData[chainId] = ChainData({
            gasPrice: gasPrice,
            blockTime: block.timestamp,
            isHealthy: isHealthy
        });
        
        emit ChainDataUpdated(chainId, gasPrice, isHealthy);
    }
    
    function getOptimalYield(uint256 amount) external view returns (
        address bestProtocol,
        uint256 bestChain,
        uint256 expectedAPY
    ) {
        uint256 bestScore = 0;
        
        for (uint i = 0; i < trackedProtocols.length; i++) {
            for (uint j = 0; j < supportedChains.length; j++) {
                ProtocolYield memory yield = protocolYields[trackedProtocols[i]][supportedChains[j]];
                
                if (!yield.isActive || yield.tvl < amount) continue;
                
                // Risk-adjusted yield calculation
                uint256 riskAdjustedAPY = (yield.apy * (10000 - yield.riskScore)) / 10000;
                
                // Factor in gas costs
                uint256 gasCost = chainData[supportedChains[j]].gasPrice;
                uint256 effectiveAPY = riskAdjustedAPY > gasCost ? riskAdjustedAPY - gasCost : 0;
                
                if (effectiveAPY > bestScore) {
                    bestScore = effectiveAPY;
                    bestProtocol = trackedProtocols[i];
                    bestChain = supportedChains[j];
                    expectedAPY = yield.apy;
                }
            }
        }
        
        return (bestProtocol, bestChain, expectedAPY);
    }
    
    function getLatestPrice(address priceFeed) external view returns (int256) {
        (, int256 price, , , ) = priceFeeds[priceFeed].latestRoundData();
        return price;
    }
    
    function addTrackedProtocol(address protocol) external onlyOwner {
        trackedProtocols.push(protocol);
    }
    
    function addSupportedChain(uint256 chainId) external onlyOwner {
        supportedChains.push(chainId);
    }
}*/

pragma solidity ^0.8.19;

import "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrossChainManager is CCIPReceiver, Ownable {
    error InvalidRouter(address router);
    error InvalidSender(bytes sender);
    error InvalidChain(uint64 chainSelector);
    
    struct ChainConfig {
        address vault;
        bool isActive;
        uint256 gasLimit;
    }
    
    mapping(uint64 => ChainConfig) public chainConfigs;
    mapping(bytes32 => bool) public processedMessages;
    
    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChain,
        address sender,
        bytes data
    );
    
    event RebalanceExecuted(
        uint64 sourceChain,
        uint64 destChain,
        uint256 amount
    );
    
    constructor(address _router) CCIPReceiver(_router) {}
    
    function _ccipReceive(Client.Any2EVMMessage memory message) 
        internal 
        override 
    {
        bytes32 messageId = message.messageId;
        uint64 sourceChain = message.sourceChainSelector;
        
        // Validate sender
        address sender = abi.decode(message.sender, (address));
        require(
            sender == chainConfigs[sourceChain].vault,
            "Invalid sender"
        );
        
        // Prevent replay
        require(!processedMessages[messageId], "Already processed");
        processedMessages[messageId] = true;
        
        // Decode and execute
        (uint256 amount, bytes memory strategyData) = abi.decode(
            message.data,
            (uint256, bytes)
        );
        
        // Execute strategy
        _executeStrategy(sourceChain, amount, strategyData);
        
        emit MessageReceived(messageId, sourceChain, sender, message.data);
    }
    
    function _executeStrategy(
        uint64 sourceChain,
        uint256 amount,
        bytes memory strategyData
    ) private {
        // Decode strategy instructions
        (uint8 action, address protocol, bytes memory params) = abi.decode(
            strategyData,
            (uint8, address, bytes)
        );
        
        if (action == 0) { // Deposit to protocol
            _depositToProtocol(protocol, amount, params);
        } else if (action == 1) { // Withdraw from protocol
            _withdrawFromProtocol(protocol, amount, params);
        } else if (action == 2) { // Swap and deposit
            _swapAndDeposit(protocol, amount, params);
        }
        
        emit RebalanceExecuted(sourceChain, block.chainid, amount);
    }
    
    function _depositToProtocol(
        address protocol,
        uint256 amount,
        bytes memory params
    ) private {
        // Example: Deposit to Aave
        if (protocol == AAVE_POOL) {
            IAavePool(protocol).supply(asset, amount, address(this), 0);
        }
        // Add more protocol integrations
    }
    
    function configureChain(
        uint64 chainSelector,
        address vault,
        uint256 gasLimit
    ) external onlyOwner {
        chainConfigs[chainSelector] = ChainConfig({
            vault: vault,
            isActive: true,
            gasLimit: gasLimit
        });
    }
}