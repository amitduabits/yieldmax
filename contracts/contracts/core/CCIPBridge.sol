// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CCIPBridge is CCIPReceiver, Ownable {
    IRouterClient public immutable router;
    IERC20 public immutable token;
    
    mapping(uint64 => bool) public allowedChains;
    mapping(address => uint256) public balances;
    
    event TokensSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        uint256 amount,
        uint256 fees
    );
    
    event TokensReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        uint256 amount
    );
    
    constructor(address _router, address _token) CCIPReceiver(_router) {
        router = IRouterClient(_router);
        token = IERC20(_token);
    }
    
    function allowChain(uint64 chainSelector, bool allowed) external onlyOwner {
        allowedChains[chainSelector] = allowed;
    }
    
    function bridgeTokens(
        uint64 destinationChainSelector,
        address receiver,
        uint256 amount
    ) external payable returns (bytes32 messageId) {  // Added payable here
        require(allowedChains[destinationChainSelector], "Chain not allowed");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from sender to this contract
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Create CCIP message - encode both sender and receiver in data
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)), // The bridge contract on destination chain
            data: abi.encode(msg.sender, receiver, amount), // sender, receiver, amount
            tokenAmounts: new Client.EVMTokenAmount[](1),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0) // Pay in native token
        });
        
        // Add token amount
        message.tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(token),
            amount: amount
        });
        
        // Calculate fees
        uint256 fees = router.getFee(destinationChainSelector, message);
        require(msg.value >= fees, "Insufficient fees");
        
        // Approve router to spend tokens
        token.approve(address(router), amount);
        
        // Send message
        messageId = router.ccipSend{value: fees}(destinationChainSelector, message);
        
        emit TokensSent(messageId, destinationChainSelector, receiver, amount, fees);
        
        // Refund excess fees
        if (msg.value > fees) {
            payable(msg.sender).transfer(msg.value - fees);
        }
    }
    
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        require(allowedChains[message.sourceChainSelector], "Chain not allowed");
        
        // Decode the data to get sender, receiver, and amount
        (address originalSender, address receiver, uint256 amount) = abi.decode(
            message.data, 
            (address, address, uint256)
        );
        
        // The tokens have already been transferred to this contract by CCIP
        // Transfer them to the intended receiver
        require(token.transfer(receiver, amount), "Transfer failed");
        
        emit TokensReceived(
            message.messageId,
            message.sourceChainSelector,
            originalSender,
            amount
        );
    }
    
    function calculateBridgeFees(
        uint64 destinationChainSelector,
        address receiver,
        uint256 amount
    ) external view returns (uint256 fees) {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)), // The bridge contract on destination chain
            data: abi.encode(msg.sender, receiver, amount), // sender, receiver, amount
            tokenAmounts: new Client.EVMTokenAmount[](1),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0)
        });
        
        message.tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(token),
            amount: amount
        });
        
        fees = router.getFee(destinationChainSelector, message);
    }
    
    // Emergency functions
    function withdrawToken(address _token, uint256 amount) external onlyOwner {
        IERC20(_token).transfer(owner(), amount);
    }
    
    function withdrawNative() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {}
}