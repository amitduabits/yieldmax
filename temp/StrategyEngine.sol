// contracts/StrategyEngine.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IStrategyEngine.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StrategyEngine is IStrategyEngine, Ownable {
    mapping(address => uint8) public protocolRiskScores;
    mapping(address => mapping(uint64 => uint256)) public protocolYields;
    
    uint256 private constant PRECISION = 1e18;
    uint256 private constant MIN_PROFIT_THRESHOLD = 1000e18;
    
    function calculateOptimalAllocation(bytes memory marketData)
        external
        view
        override
        returns (bytes memory allocation)
    {
        // Decode market data
        (
            address[] memory protocols,
            uint256[] memory yields,
            uint256[] memory tvls,
            uint256 totalAmount
        ) = abi.decode(marketData, (address[], uint256[], uint256[], uint256));
        
        uint256[] memory allocations = new uint256[](protocols.length);
        
        // Simple allocation logic for now
        for (uint256 i = 0; i < protocols.length; i++) {
            allocations[i] = totalAmount / protocols.length;
        }
        
        allocation = abi.encode(protocols, allocations);
    }
    
    function validateRebalance(bytes memory instructions)
        external
        pure
        override
        returns (bool profitable, uint256 expectedGain)
    {
        // Simple validation for testnet
        profitable = true;
        expectedGain = MIN_PROFIT_THRESHOLD;
    }
    
    function setProtocolRiskScore(address protocol, uint8 score) 
        external 
        onlyOwner 
    {
        require(score <= 100, "Score too high");
        protocolRiskScores[protocol] = score;
    }
}