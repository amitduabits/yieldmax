// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IStrategyEngine {
    function calculateOptimalAllocation(bytes memory marketData) 
        external view returns (bytes memory allocation);
        
    function validateRebalance(bytes memory instructions) 
        external view returns (bool profitable, uint256 expectedGain);
}