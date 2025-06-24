// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract CrossChainManager is CCIPReceiver, Ownable {
    IRouterClient private immutable i_router;
    IERC20 private immutable i_linkToken;
    address public immutable i_vault;
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
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    // Removed InvalidRouter as it's already declared in CCIPReceiver
    constructor(address _vault, address _router, address _link) CCIPReceiver(_router) {
        if (_router == address(0)) revert InvalidRouter(address(0));
        i_vault = _vault;
        i_router = IRouterClient(_router);
        i_linkToken = IERC20(_link);
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
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            receiver,
            abi.encode(message),
            address(i_linkToken)
        );
        uint256 fees = i_router.getFee(destinationChainSelector, evm2AnyMessage);
        if (fees > i_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(i_linkToken.balanceOf(address(this)), fees);
        i_linkToken.approve(address(i_router), fees);
        messageId = i_router.ccipSend(destinationChainSelector, evm2AnyMessage);
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
            _handleRebalance(message.data);
        } else if (keccak256(bytes(message.action)) == keccak256(bytes("sync"))) {
            _handleSync(message.data);
        }
    }
    function _buildCCIPMessage(
        address _receiver,
        bytes memory _data,
        address _feeTokenAddress
    ) internal pure returns (Client.EVM2AnyMessage memory) {
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver),
                data: _data,
                tokenAmounts: new Client.EVMTokenAmount[](0),
                extraArgs: Client._argsToBytes(
                    Client.EVMExtraArgsV1({gasLimit: 200_000})
                ),
                feeToken: _feeTokenAddress
            });
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
        uint256 balance = i_linkToken.balanceOf(address(this));
        if (balance == 0) revert NothingToWithdraw();
        i_linkToken.transfer(owner(), balance);
    }
    // Fixed: Added override and changed to public
    function getRouter() public view override returns (address) {
        return address(i_router);
    }
}