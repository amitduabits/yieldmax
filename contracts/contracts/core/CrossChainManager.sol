// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interface for Aave V3 Pool
interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

// Interface for Compound
interface ICompound {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
}

contract CrossChainManager is CCIPReceiver, Ownable {
    // Remove duplicate error - using CCIPReceiver's InvalidRouter
    error InvalidSender(bytes sender);
    error InvalidChain(uint64 chainSelector);
    error StrategyExecutionFailed(string reason);
    
    // Protocol addresses
    address public AAVE_POOL;
    address public COMPOUND_CTOKEN;
    address public asset; // USDC or other asset
    
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
    
    event ProtocolDeposit(
        address indexed protocol,
        uint256 amount,
        bool success
    );
    
    constructor(
        address _router,
        address _asset
    ) CCIPReceiver(_router) Ownable(msg.sender) {  // Fixed: Added initialOwner parameter
        asset = _asset;
    }
    
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
        bytes memory /* params */
    ) private {
        bool success = false;
        
        if (IERC20(asset).balanceOf(address(this)) >= amount) {
            // Ensure we have approval for the asset
            IERC20(asset).approve(protocol, amount);
            
            if (protocol == AAVE_POOL && AAVE_POOL != address(0)) {
                // Deposit to Aave V3
                IAavePool(protocol).supply(asset, amount, address(this), 0);
                success = true;
            } else if (protocol == COMPOUND_CTOKEN && COMPOUND_CTOKEN != address(0)) {
                // Deposit to Compound
                uint256 result = ICompound(protocol).mint(amount);
                success = (result == 0); // Compound returns 0 on success
            }
        }
        
        emit ProtocolDeposit(protocol, amount, success);
    }
    
    function _withdrawFromProtocol(
        address protocol,
        uint256 amount,
        bytes memory /* params */
    ) private {
        if (protocol == AAVE_POOL && AAVE_POOL != address(0)) {
            // Withdraw from Aave V3
            IAavePool(protocol).withdraw(asset, amount, address(this));
        } else if (protocol == COMPOUND_CTOKEN && COMPOUND_CTOKEN != address(0)) {
            // Withdraw from Compound
            ICompound(protocol).redeem(amount);
        }
    }
    
    function _swapAndDeposit(
        address protocol,
        uint256 amount,
        bytes memory params
    ) private {
        // For now, just deposit directly (implement swap logic later)
        _depositToProtocol(protocol, amount, params);
    }
    
    // Configuration functions
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
    
    function setProtocolAddresses(
        address _aavePool,
        address _compoundCToken
    ) external onlyOwner {
        AAVE_POOL = _aavePool;
        COMPOUND_CTOKEN = _compoundCToken;
    }
    
    function setAsset(address _asset) external onlyOwner {
        asset = _asset;
    }
    
    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    // View functions
    function getChainConfig(uint64 chainSelector) external view returns (ChainConfig memory) {
        return chainConfigs[chainSelector];
    }
    
    function isMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedMessages[messageId];
    }
}