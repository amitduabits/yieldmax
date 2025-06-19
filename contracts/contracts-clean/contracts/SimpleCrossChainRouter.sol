// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleCrossChainRouter
 * @notice Simplified CCIP integration for cross-chain yield optimization
 * @dev Demonstrates cross-chain capabilities without complex stack operations
 */
contract SimpleCrossChainRouter is Ownable {
    // ==================== STRUCTS ====================
    struct ChainInfo {
        string name;
        uint256 bestApy;
        uint256 tvl;
        bool active;
    }
    
    struct RebalanceRecord {
        uint256 timestamp;
        string fromChain;
        string toChain;
        uint256 amount;
        uint256 targetApy;
    }
    
    // ==================== STATE VARIABLES ====================
    mapping(uint64 => ChainInfo) public chainData;
    RebalanceRecord[] public rebalanceHistory;
    
    uint64[] public supportedChains;
    uint256 public totalCrossChainVolume;
    uint256 public totalRebalances;
    
    // Chain selectors
    uint64 public constant SEPOLIA = 16015286601757825753;
    uint64 public constant ARBITRUM_SEPOLIA = 3478487238524512106;
    uint64 public constant OPTIMISM_SEPOLIA = 5224473277236331295;
    
    // Mock CCIP router for demo
    address public ccipRouter;
    address public linkToken;
    
    // ==================== EVENTS ====================
    event CrossChainOpportunityFound(string fromChain, string toChain, uint256 apyDiff);
    event CrossChainTransferInitiated(string fromChain, string toChain, uint256 amount);
    event ChainDataUpdated(uint64 chain, uint256 apy);
    
    // ==================== CONSTRUCTOR ====================
    constructor() Ownable(msg.sender) {
        // Initialize chains with mock data
        _initializeChains();
        
        // Set mock addresses
        ccipRouter = address(0x1234567890123456789012345678901234567890);
        linkToken = address(0x0987654321098765432109876543210987654321);
    }
    
    // ==================== EXTERNAL FUNCTIONS ====================
    
    /**
     * @notice Update chain yield data
     */
    function updateChainData(
        uint64 chainSelector,
        uint256 newApy,
        uint256 newTvl
    ) external onlyOwner {
        require(chainData[chainSelector].active, "Chain not active");
        
        chainData[chainSelector].bestApy = newApy;
        chainData[chainSelector].tvl = newTvl;
        
        emit ChainDataUpdated(chainSelector, newApy);
    }
    
    /**
     * @notice Find best cross-chain opportunity
     */
    function findBestOpportunity(uint256 amount) external view returns (
        string memory currentChainName,
        string memory targetChainName,
        uint256 currentApy,
        uint256 targetApy,
        uint256 apyImprovement
    ) {
        uint64 currentChain = _getCurrentChain();
        ChainInfo memory current = chainData[currentChain];
        
        uint64 bestChain = currentChain;
        uint256 bestApy = current.bestApy;
        
        for (uint256 i = 0; i < supportedChains.length; i++) {
            uint64 chain = supportedChains[i];
            ChainInfo memory info = chainData[chain];
            
            if (chain != currentChain && info.active && info.tvl >= amount) {
                if (info.bestApy > bestApy) {
                    bestApy = info.bestApy;
                    bestChain = chain;
                }
            }
        }
        
        currentChainName = current.name;
        targetChainName = chainData[bestChain].name;
        currentApy = current.bestApy;
        targetApy = bestApy;
        apyImprovement = targetApy > currentApy ? targetApy - currentApy : 0;
    }
    
    /**
     * @notice Simulate cross-chain transfer
     */
    function initiateCrossChainTransfer(
        uint64 targetChain,
        uint256 amount
    ) external onlyOwner returns (bool) {
        require(chainData[targetChain].active, "Target chain not active");
        require(amount > 0, "Invalid amount");
        
        uint64 currentChain = _getCurrentChain();
        require(targetChain != currentChain, "Same chain");
        
        // Record the transfer
        rebalanceHistory.push(RebalanceRecord({
            timestamp: block.timestamp,
            fromChain: chainData[currentChain].name,
            toChain: chainData[targetChain].name,
            amount: amount,
            targetApy: chainData[targetChain].bestApy
        }));
        
        totalRebalances++;
        totalCrossChainVolume += amount;
        
        emit CrossChainTransferInitiated(
            chainData[currentChain].name,
            chainData[targetChain].name,
            amount
        );
        
        // In production, this would interact with CCIP
        // For demo, we just record the transfer
        return true;
    }
    
    /**
     * @notice Get cross-chain statistics
     */
    function getStats() external view returns (
        uint256 rebalanceCount,
        uint256 volume,
        uint256 chainCount
    ) {
        return (totalRebalances, totalCrossChainVolume, supportedChains.length);
    }
    
    /**
     * @notice Get all chain data
     */
    function getAllChainData() external view returns (
        string[] memory names,
        uint256[] memory apys,
        uint256[] memory tvls
    ) {
        uint256 len = supportedChains.length;
        names = new string[](len);
        apys = new uint256[](len);
        tvls = new uint256[](len);
        
        for (uint256 i = 0; i < len; i++) {
            ChainInfo memory info = chainData[supportedChains[i]];
            names[i] = info.name;
            apys[i] = info.bestApy;
            tvls[i] = info.tvl;
        }
    }
    
    /**
     * @notice Get recent rebalances
     */
    function getRecentRebalances(uint256 count) external view returns (
        RebalanceRecord[] memory
    ) {
        uint256 len = rebalanceHistory.length;
        if (count > len) count = len;
        
        RebalanceRecord[] memory recent = new RebalanceRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = rebalanceHistory[len - count + i];
        }
        
        return recent;
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @notice Initialize chain data
     */
    function _initializeChains() private {
        // Sepolia
        chainData[SEPOLIA] = ChainInfo({
            name: "Sepolia",
            bestApy: 650, // 6.5%
            tvl: 10000000 * 1e6, // 10M
            active: true
        });
        supportedChains.push(SEPOLIA);
        
        // Arbitrum Sepolia
        chainData[ARBITRUM_SEPOLIA] = ChainInfo({
            name: "Arbitrum",
            bestApy: 920, // 9.2%
            tvl: 5000000 * 1e6, // 5M
            active: true
        });
        supportedChains.push(ARBITRUM_SEPOLIA);
        
        // Optimism Sepolia
        chainData[OPTIMISM_SEPOLIA] = ChainInfo({
            name: "Optimism",
            bestApy: 780, // 7.8%
            tvl: 8000000 * 1e6, // 8M
            active: true
        });
        supportedChains.push(OPTIMISM_SEPOLIA);
    }
    
    /**
     * @notice Get current chain selector
     */
    function _getCurrentChain() private view returns (uint64) {
        uint256 chainId = block.chainid;
        
        if (chainId == 11155111) return SEPOLIA;
        if (chainId == 421614) return ARBITRUM_SEPOLIA;
        if (chainId == 11155420) return OPTIMISM_SEPOLIA;
        
        return SEPOLIA; // Default
    }
}