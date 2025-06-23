// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FunctionsConsumer is FunctionsClient, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;
    
    bytes32 public lastRequestId;
    bytes public lastResponse;
    bytes public lastError;
    
    mapping(bytes32 => string) public requestIdToProtocol;
    mapping(string => uint256) public protocolAPYs;
    
    event RequestSent(bytes32 indexed requestId, string protocol);
    event RequestFulfilled(bytes32 indexed requestId, bytes response, bytes error);
    
    constructor(address router) FunctionsClient(router) {}
    
    function sendRequest(
        string memory source,
        bytes memory encryptedSecretsUrls,
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion,
        string[] memory args,
        bytes[] memory bytesArgs,
        uint64 subscriptionId,
        uint32 gasLimit,
        bytes32 donID
    ) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        
        if (encryptedSecretsUrls.length > 0) {
            req.addSecretsReference(encryptedSecretsUrls);
        } else if (donHostedSecretsVersion > 0) {
            req.addDONHostedSecrets(donHostedSecretsSlotID, donHostedSecretsVersion);
        }
        
        if (args.length > 0) req.setArgs(args);
        if (bytesArgs.length > 0) req.setBytesArgs(bytesArgs);
        
        lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );
        
        if (args.length > 0) {
            requestIdToProtocol[lastRequestId] = args[0];
        }
        
        emit RequestSent(lastRequestId, args.length > 0 ? args[0] : "");
        return lastRequestId;
    }
    
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        lastResponse = response;
        lastError = err;
        
        // Parse response and update APY
        if (response.length > 0) {
            uint256 apy = abi.decode(response, (uint256));
            string memory protocol = requestIdToProtocol[requestId];
            if (bytes(protocol).length > 0) {
                protocolAPYs[protocol] = apy;
            }
        }
        
        emit RequestFulfilled(requestId, response, err);
    }
}