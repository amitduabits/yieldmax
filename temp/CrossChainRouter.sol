// contracts/CrossChainRouter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrossChainRouter is OwnerIsCreator {
    IRouterClient public immutable ccipRouter;
    LinkTokenInterface public immutable linkToken;
    
    struct RouteConfig {
        uint64 chainSelector;
        address vault;
        uint32 gasLimit;
        bool active;
    }
    
    mapping(uint64 => RouteConfig) public routes;
    mapping(bytes32 => bool) public processedMessages;
    
    event MessageSent(bytes32 indexed messageId, uint64 destChain, uint256 fees);
    event MessageReceived(bytes32 indexed messageId, uint64 sourceChain);
    
    constructor(address _router, address _link) {
        ccipRouter = IRouterClient(_router);
        linkToken = LinkTokenInterface(_link);
    }
    
    function configureRoute(
        uint64 _chainSelector,
        address _vault,
        uint32 _gasLimit,
        bool _active
    ) external onlyOwner {
        routes[_chainSelector] = RouteConfig({
            chainSelector: _chainSelector,
            vault: _vault,
            gasLimit: _gasLimit,
            active: _active
        });
    }
    
    function sendMessage(
        uint64 destChainSelector,
        bytes calldata data
    ) external returns (bytes32 messageId) {
        RouteConfig memory route = routes[destChainSelector];
        require(route.active, "Route inactive");
        
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(route.vault),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: route.gasLimit})
            ),
            feeToken: address(linkToken)
        });
        
        uint256 fees = ccipRouter.getFee(destChainSelector, message);
        
        linkToken.approve(address(ccipRouter), fees);
        
        messageId = ccipRouter.ccipSend(destChainSelector, message);
        
        emit MessageSent(messageId, destChainSelector, fees);
    }
}