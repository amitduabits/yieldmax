// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IStrategyEngine
 * @notice Interface for AI-powered yield optimization strategy engine
 */
interface IStrategyEngine {
    /**
     * @notice Calculate optimal yield allocation based on current market data
     * @param userBalance User's balance to optimize
     * @param riskTolerance Risk tolerance (0-1000, where 1000 is highest risk)
     * @return protocol Best protocol address
     * @return expectedYield Expected APY in basis points
     * @return confidence Confidence score (0-100)
     */
    function calculateOptimalAllocation(
        uint256 userBalance,
        uint256 riskTolerance
    ) external view returns (
        address protocol,
        uint256 expectedYield,
        uint256 confidence
    );
    
    /**
     * @notice Request fresh yield data from external sources
     * @return requestId Chainlink Functions request ID
     */
    function requestYieldUpdate() external returns (bytes32 requestId);
    
    /**
     * @notice Get current optimal strategy
     * @return protocol Protocol address
     * @return expectedYield Expected yield
     * @return confidence Confidence level
     * @return gasEstimate Estimated gas cost
     * @return timestamp Last calculation time
     */
    function getCurrentStrategy() external view returns (
        address protocol,
        uint256 expectedYield,
        uint256 confidence,
        uint256 gasEstimate,
        uint256 timestamp
    );
}