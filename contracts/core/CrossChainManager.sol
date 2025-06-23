// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrossChainManager is CCIPReceiver, Ownable {
    IRouterClient private immutable router;
    IERC20 private immutable linkToken;
    
    mapping(uint64 => address) public remoteVaults;
    mapping(uint64 => bool) public supportedChains;
    
    struct CCIPMessage {
        address sender;
        uint256 amount;
        string action;
        bytes data;
    }
    
    event MessageSent(bytes32 messageId, uint64 destinationChain, uint256 fees);
    event MessageReceived(bytes32 messageId, uint64 sourceChain, address sender);
    event ChainConfigured(uint64 chainSelector, address remoteVault);
    
    constructor(address _router, address _link) CCIPReceiver(_router) {
        router = IRouterClient(_router);
        linkToken = IERC20(_link);
    }
    
    function sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        string memory action,
        bytes memory data
    ) external payable returns (bytes32 messageId) {
        require(supportedChains[destinationChainSelector], "Chain not supported");
        
        CCIPMessage memory message = CCIPMessage({
            sender: msg.sender,
            amount: msg.value,
            action: action,
            data: data
        });
        
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(message),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(linkToken)
        });
        
        uint256 fees = router.getFee(destinationChainSelector, evm2AnyMessage);
        
        require(linkToken.balanceOf(address(this)) >= fees, "Insufficient LINK");
        
        linkToken.approve(address(router), fees);
        
        messageId = router.ccipSend(destinationChainSelector, evm2AnyMessage);
        
        emit MessageSent(messageId, destinationChainSelector, fees);
        
        return messageId;
    }
    
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        CCIPMessage memory message = abi.decode(any2EvmMessage.data, (CCIPMessage));
        
        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            message.sender
        );
        
        // Process message based on action
        if (keccak256(bytes(message.action)) == keccak256(bytes("rebalance"))) {
            // Handle cross-chain rebalance request
            _handleRebalance(message.data);
        } else if (keccak256(bytes(message.action)) == keccak256(bytes("sync"))) {
            // Handle state synchronization
            _handleSync(message.data);
        }
    }
    
    function _handleRebalance(bytes memory data) private {
        // Implement rebalance logic
    }
    
    function _handleSync(bytes memory data) private {
        // Implement sync logic
    }
    
    function configureChain(uint64 chainSelector, address remoteVault) external onlyOwner {
        supportedChains[chainSelector] = true;
        remoteVaults[chainSelector] = remoteVault;
        emit ChainConfigured(chainSelector, remoteVault);
    }
    
    function withdrawLink() external onlyOwner {
        uint256 balance = linkToken.balanceOf(address(this));
        require(balance > 0, "No LINK to withdraw");
        linkToken.transfer(owner(), balance);
    }
}