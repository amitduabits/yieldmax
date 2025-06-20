// contracts/RealCCIPCrossChainManager.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

contract RealCCIPCrossChainManager is CCIPReceiver {
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    
    // Event emitted when a message is sent to another chain.
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        string text,
        address feeToken,
        uint256 fees
    );

    // Event emitted when a message is received from another chain.
    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        string text
    );

    bytes32 private lastReceivedMessageId;
    string private lastReceivedText;
    
    LinkTokenInterface linkToken;
    
    constructor(address _router, address _link) CCIPReceiver(_router) {
        linkToken = LinkTokenInterface(_link);
    }
    
    /// @notice Sends data to receiver on the destination chain.
    /// @dev Assumes your contract has sufficient LINK.
    /// @param destinationChainSelector The identifier for the destination blockchain.
    /// @param receiver The address of the recipient on the destination blockchain.
    /// @param text The string data to be sent.
    /// @return messageId The ID of the message sent.
    function sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        string calldata text
    ) external returns (bytes32 messageId) {
        // Create an EVM2AnyMessage struct in memory
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(text),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000, strict: false})
            ),
            feeToken: address(linkToken)
        });
        
        // Get fee required
        uint256 fees = IRouterClient(i_router).getFee(
            destinationChainSelector,
            evm2AnyMessage
        );
        
        if (fees > linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(linkToken.balanceOf(address(this)), fees);
        
        // Approve Router to transfer LINK tokens
        linkToken.approve(address(i_router), fees);
        
        // Send message
        messageId = IRouterClient(i_router).ccipSend(
            destinationChainSelector,
            evm2AnyMessage
        );
        
        emit MessageSent(
            messageId,
            destinationChainSelector,
            receiver,
            text,
            address(linkToken),
            fees
        );
        
        return messageId;
    }
    
    /// handle a received message
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        lastReceivedMessageId = any2EvmMessage.messageId;
        lastReceivedText = abi.decode(any2EvmMessage.data, (string));
        
        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            abi.decode(any2EvmMessage.data, (string))
        );
    }
    
    /// @notice Fetches the details of the last received message.
    function getLastReceivedMessageDetails() external view returns (bytes32 messageId, string memory text) {
        return (lastReceivedMessageId, lastReceivedText);
    }
}