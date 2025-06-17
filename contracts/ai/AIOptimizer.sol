// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/functions/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

contract AIOptimizer is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;
    
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public gasLimit = 300_000;
    
    // JavaScript source code for AI optimization
    string public source = 
        "const apiKey = secrets.apiKey;"
        "const yieldData = args[0];"
        "const currentPositions = args[1];"
        "const gasPrice = args[2];"
        ""
        "// Fetch current yields from multiple sources"
        "const aaveYield = await Functions.makeHttpRequest({"
        "  url: `https://api.aave.com/v3/markets/yields`,"
        "  headers: { 'X-API-Key': apiKey }"
        "});"
        ""
        "const compoundYield = await Functions.makeHttpRequest({"
        "  url: `https://api.compound.finance/v2/ctoken`,"
        "});"
        ""
        "// Calculate optimal allocation"
        "const yields = {"
        "  aave: parseFloat(aaveYield.data.ethereum.apy),"
        "  compound: parseFloat(compoundYield.data.supply_rate),"
        "  gmx: 25.5 // Example static yield"
        "};"
        ""
        "// Gas-adjusted optimization"
        "const gasAdjustedYields = {};"
        "for (const [protocol, apy] of Object.entries(yields)) {"
        "  const gasCost = calculateGasCost(protocol, gasPrice);"
        "  gasAdjustedYields[protocol] = apy - gasCost;"
        "}"
        ""
        "// Find best allocation"
        "const sorted = Object.entries(gasAdjustedYields)"
        "  .sort((a, b) => b[1] - a[1]);"
        ""
        "// Return optimization instructions"
        "return Functions.encodeUint256(sorted[0][1] * 100);";
    
    mapping(bytes32 => address) public requestIdToVault;
    mapping(address => uint256) public vaultToOptimalYield;
    
    event OptimizationRequested(bytes32 indexed requestId, address vault);
    event OptimizationReceived(bytes32 indexed requestId, uint256 optimalYield);
    
    constructor(
        address _router,
        bytes32 _donId,
        uint64 _subscriptionId
    ) FunctionsClient(_router) ConfirmedOwner(msg.sender) {
        donId = _donId;
        subscriptionId = _subscriptionId;
    }
    
    function requestOptimization(
        address vault,
        string[] calldata args,
        bytes calldata secrets
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        
        if (secrets.length > 0) {
            req.addSecretsReference(secrets);
        }
        
        req.setArgs(args);
        
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );
        
        requestIdToVault[requestId] = vault;
        emit OptimizationRequested(requestId, vault);
    }
    
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        require(requestIdToVault[requestId] != address(0), "Invalid request");
        
        if (err.length > 0) {
            // Handle error
            return;
        }
        
        uint256 optimalYield = abi.decode(response, (uint256));
        address vault = requestIdToVault[requestId];
        
        vaultToOptimalYield[vault] = optimalYield;
        
        // Trigger rebalance if yield improvement > 2%
        if (optimalYield > getCurrentYield(vault) + 200) {
            IYieldMaxVault(vault).triggerRebalance();
        }
        
        emit OptimizationReceived(requestId, optimalYield);
    }
    
    function getCurrentYield(address vault) public view returns (uint256) {
        // Implementation to get current yield
        return vaultToOptimalYield[vault];
    }
}