// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockCCIPRouter {
    mapping(bytes32 => bool) public processedMessages;
    
    event MessageSent(bytes32 messageId, uint64 destinationChain, bytes data);
    event MessageReceived(bytes32 messageId, uint64 sourceChain, bytes data);
    
    function getFee(uint64 destinationChain, bytes calldata data) 
        external 
        pure 
        returns (uint256) 
    {
        return 0.01 ether + (data.length * 1000);
    }
    
    function ccipSend(uint64 destinationChain, bytes calldata message) 
        external 
        payable 
        returns (bytes32) 
    {
        bytes32 messageId = keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            destinationChain,
            message
        ));
        
        emit MessageSent(messageId, destinationChain, message);
        return messageId;
    }
    
    function deliverMessage(
        address receiver,
        bytes32 messageId,
        uint64 sourceChain,
        address sender,
        bytes calldata data
    ) external {
        require(!processedMessages[messageId], "Already processed");
        processedMessages[messageId] = true;
        
        (bool success, ) = receiver.call(
            abi.encodeWithSignature(
                "ccipReceive(bytes32,uint64,address,bytes)",
                messageId,
                sourceChain,
                sender,
                data
            )
        );
        require(success, "Message delivery failed");
        
        emit MessageReceived(messageId, sourceChain, data);
    }
}
