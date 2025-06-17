// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAIOptimizer {
    function requestOptimization(
        address vault,
        string[] calldata args,
        bytes calldata secrets
    ) external returns (bytes32);
}
