// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICrossChainManager {
    function sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        string memory action,
        bytes memory data
    ) external payable returns (bytes32 messageId);
    
    function configureChain(uint64 chainSelector, address remoteVault) external;
    function withdrawLink() external;
}