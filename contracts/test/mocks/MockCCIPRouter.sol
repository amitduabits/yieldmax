// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

contract MockCCIPRouter {
    uint256 private constant MOCK_FEE = 0.1 ether;
    bytes32 private nextMessageId = keccak256("MESSAGE_1");
    
    event MessageSent(bytes32 messageId);
    
    function getFee(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) external pure returns (uint256) {
        return MOCK_FEE;
    }
    
    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage calldata message
    ) external payable returns (bytes32 messageId) {
        require(msg.value >= MOCK_FEE || message.feeToken != address(0), "Insufficient fee");
        
        messageId = nextMessageId;
        nextMessageId = keccak256(abi.encodePacked(nextMessageId));
        
        emit MessageSent(messageId);
        return messageId;
    }
}