// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IStrategyEngine.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StrategyEngine
 * @notice Yield optimization logic
 */
contract StrategyEngine is IStrategyEngine, Ownable {
    
    uint256 private constant PRECISION = 1e18;
    uint256 private constant MAX_SLIPPAGE = 50; // 0.5%
    uint256 private constant MIN_PROFIT_THRESHOLD = 1000e6; // $1000 USDC
    
    mapping(address => uint8) public protocolRiskScores;
    mapping(address => mapping(uint64 => uint256)) public protocolYields;
    
    struct RebalanceInstruction {
        uint8 action;
        address protocol;
        uint128 amount;
        bytes32 params;
    }
    
    constructor() Ownable(msg.sender) {
        // Initialize risk scores
        protocolRiskScores[0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2] = 10; // Aave
        protocolRiskScores[0xc3d688B66703497DAA19211EEdff47f25384cdc3] = 15; // Compound
        protocolRiskScores[0x777777c9898D384F785Ee44Acfe945efDFf5f3E0] = 20; // Morpho
    }
    
    function calculateOptimalAllocation(bytes memory marketData)
        external
        view
        override
        returns (bytes memory allocation)
    {
        (
            address[] memory protocols,
            uint256[] memory yields,
            uint256[] memory tvls,
            uint256 totalAmount
        ) = abi.decode(marketData, (address[], uint256[], uint256[], uint256));
        
        uint256 length = protocols.length;
        uint256[] memory allocations = new uint256[](length);
        
        // Calculate risk-adjusted yields
        uint256[] memory adjustedYields = new uint256[](length);
        uint256 totalAdjustedYield;
        
        for (uint256 i; i < length;) {
            uint256 riskMultiplier = 100 - protocolRiskScores[protocols[i]];
            adjustedYields[i] = (yields[i] * riskMultiplier) / 100;
            
            if (tvls[i] > 0) {
                adjustedYields[i] = (adjustedYields[i] * _sqrt(tvls[i])) / 1e9;
            }
            
            totalAdjustedYield += adjustedYields[i];
            
            unchecked { ++i; }
        }
        
        // Allocate proportionally
        for (uint256 i; i < length;) {
            if (totalAdjustedYield > 0) {
                allocations[i] = (totalAmount * adjustedYields[i]) / totalAdjustedYield;
                
                // Max 40% per protocol
                uint256 maxAllocation = (totalAmount * 40) / 100;
                if (allocations[i] > maxAllocation) {
                    allocations[i] = maxAllocation;
                }
                
                // Min $50k position
                if (allocations[i] < 50_000e6 && allocations[i] > 0) {
                    allocations[i] = 0;
                }
            }
            
            unchecked { ++i; }
        }
        
        allocation = abi.encode(protocols, allocations);
    }
    
    function validateRebalance(bytes memory instructions)
        external
        view
        override
        returns (bool profitable, uint256 expectedGain)
    {
        RebalanceInstruction[] memory rebalanceInstructions = abi.decode(
            instructions,
            (RebalanceInstruction[])
        );
        
        uint256 totalCost;
        uint256 totalBenefit;
        
        for (uint256 i; i < rebalanceInstructions.length;) {
            RebalanceInstruction memory inst = rebalanceInstructions[i];
            
            uint256 gasCost = _estimateGasCost(inst.action, inst.amount);
            totalCost += gasCost;
            
            if (inst.action == 0 || inst.action == 2) {
                uint256 yieldRate = protocolYields[inst.protocol][uint64(block.chainid)];
                uint256 dailyYield = (inst.amount * yieldRate) / 365 / PRECISION;
                totalBenefit += dailyYield * 30; // 30-day benefit
            }
            
            unchecked { ++i; }
        }
        
        expectedGain = totalBenefit > totalCost ? totalBenefit - totalCost : 0;
        profitable = expectedGain > MIN_PROFIT_THRESHOLD;
    }
    
    // Admin functions
    function setProtocolRiskScore(address protocol, uint8 riskScore) external onlyOwner {
        require(riskScore <= 100, "Risk score too high");
        protocolRiskScores[protocol] = riskScore;
    }
    
    function setProtocolYield(address protocol, uint64 chainId, uint256 yield) external onlyOwner {
        protocolYields[protocol][chainId] = yield;
    }
    
    // View functions
    function getProtocolRiskScore(address protocol) external view returns (uint8) {
        return protocolRiskScores[protocol];
    }
    
    function getProtocolYield(address protocol, uint64 chainId) external view returns (uint256) {
        return protocolYields[protocol][chainId];
    }
    
    // Internal helper functions
    function _sqrt(uint256 x) private pure returns (uint256 z) {
        assembly {
            z := add(shr(1, x), 1)
            
            let tmp := add(div(x, z), z)
            z := shr(1, tmp)
            
            tmp := add(div(x, z), z)
            z := shr(1, tmp)
            
            tmp := add(div(x, z), z)
            z := shr(1, tmp)
            
            if lt(z, div(x, z)) { z := div(x, z) }
        }
    }
    
    function _estimateGasCost(uint8 action, uint256 amount) 
        private 
        pure 
        returns (uint256)
    {
        uint256 baseGas;
        
        if (action == 0) {
            baseGas = 150_000; // Deposit
        } else if (action == 1) {
            baseGas = 200_000; // Withdraw
        } else {
            baseGas = 300_000; // Cross-chain
        }
        
        if (amount > 1_000_000e6) {
            baseGas += 50_000;
        }
        
        return (baseGas * 2e18) / 100_000; // $2 per 100k gas
    }
}