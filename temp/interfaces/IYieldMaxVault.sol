// contracts/interfaces/IYieldMaxVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IYieldMaxVault {
    struct Position {
        uint128 amount;
        uint64 lastUpdate;
        uint64 chainId;
    }
    
    struct RebalanceInstruction {
        uint8 action;
        address protocol;
        uint128 amount;
        bytes32 params;
    }
    
    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event RebalanceExecuted(uint256 indexed epoch, uint256 gasUsed);
    event CrossChainMessage(uint64 indexed destChain, bytes32 messageId);
}