// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WorkingStrategyEngine
 * @notice Real yield optimization with dynamic data
 * @dev Simulates real DeFi protocols with changing yields
 */
contract WorkingStrategyEngine is Ownable {
    // ==================== STRUCTS ====================
    struct ProtocolInfo {
        string name;
        uint256 baseApy;
        uint256 riskScore; // 0-1000, lower is safer
        uint256 tvl;
        bool active;
    }
    
    struct YieldData {
        uint256 currentApy;
        uint256 tvl;
        uint256 utilizationRate;
        uint256 lastUpdate;
    }
    
    struct OptimalStrategy {
        address protocol;
        uint256 expectedApy;
        uint256 confidence;
        string protocolName;
    }
    
    // ==================== STATE VARIABLES ====================
    mapping(address => ProtocolInfo) public protocols;
    mapping(address => YieldData) public currentYields;
    address[] public protocolList;
    
    uint256 public lastUpdateBlock;
    uint256 public updateCount;
    
    // ==================== EVENTS ====================
    event YieldUpdated(address indexed protocol, uint256 newApy, uint256 tvl);
    event StrategyCalculated(address indexed user, address indexed protocol, uint256 apy);
    event ProtocolAdded(string name, address protocol);
    
    // ==================== CONSTRUCTOR ====================
    constructor() Ownable(msg.sender) {
        _initializeProtocols();
    }
    
    // ==================== EXTERNAL FUNCTIONS ====================
    
    /**
     * @notice Update yields based on market simulation
     */
    function updateYieldData() external returns (bool) {
        require(block.number > lastUpdateBlock, "Too soon");
        
        updateCount++;
        lastUpdateBlock = block.number;
        
        for (uint256 i = 0; i < protocolList.length; i++) {
            address protocolAddr = protocolList[i];
            ProtocolInfo memory info = protocols[protocolAddr];
            
            if (!info.active) continue;
            
            // Simulate market dynamics
            uint256 marketVolatility = (block.timestamp + i) % 100;
            uint256 utilizationImpact = 7000 + (block.number % 3000); // 70-100%
            
            // Calculate dynamic APY
            uint256 baseApy = info.baseApy;
            uint256 variance = (baseApy * marketVolatility) / 1000; // Up to 10% variance
            uint256 dynamicApy;
            
            if (block.timestamp % 2 == 0) {
                dynamicApy = baseApy + variance;
            } else {
                dynamicApy = baseApy > variance ? baseApy - variance : baseApy;
            }
            
            // Add utilization bonus
            if (utilizationImpact > 8500) {
                dynamicApy = (dynamicApy * 110) / 100; // 10% bonus for high utilization
            }
            
            // Update TVL with some randomness
            uint256 tvlChange = (info.tvl * (5 + (block.number % 10))) / 100;
            uint256 newTvl = block.timestamp % 3 == 0 ? 
                info.tvl + tvlChange : 
                info.tvl > tvlChange ? info.tvl - tvlChange : info.tvl;
            
            currentYields[protocolAddr] = YieldData({
                currentApy: dynamicApy,
                tvl: newTvl,
                utilizationRate: utilizationImpact,
                lastUpdate: block.timestamp
            });
            
            emit YieldUpdated(protocolAddr, dynamicApy, newTvl);
        }
        
        return true;
    }
    
    /**
     * @notice Get optimal strategy based on user preferences
     */
    function getOptimalStrategy(
        uint256 amount,
        uint256 riskTolerance // 0-10000, where 10000 is max risk
    ) external view returns (
        address bestProtocol,
        uint256 expectedApy,
        uint256 confidence
    ) {
        require(protocolList.length > 0, "No protocols");
        require(amount > 0, "Invalid amount");
        
        uint256 bestScore = 0;
        string memory bestProtocolName;
        
        for (uint256 i = 0; i < protocolList.length; i++) {
            address protocol = protocolList[i];
            ProtocolInfo memory info = protocols[protocol];
            YieldData memory yield = currentYields[protocol];
            
            if (!info.active || yield.tvl < amount * 10) continue;
            
            // Multi-factor scoring
            uint256 apyScore = (yield.currentApy * 40) / 100;
            uint256 safetyScore = ((1000 - info.riskScore) * 30) / 1000;
            uint256 liquidityScore = _calculateLiquidityScore(yield.tvl, amount);
            uint256 utilizationScore = (yield.utilizationRate * 10) / 10000;
            
            uint256 totalScore = apyScore + safetyScore + liquidityScore + utilizationScore;
            
            // Risk adjustment
            if (riskTolerance < 3000) {
                // Conservative: Prioritize safety
                totalScore = (totalScore * 60 + safetyScore * 40) / 100;
            } else if (riskTolerance > 7000) {
                // Aggressive: Prioritize yield
                totalScore = (totalScore * 60 + apyScore * 40) / 100;
            }
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestProtocol = protocol;
                expectedApy = yield.currentApy;
                bestProtocolName = info.name;
                confidence = (totalScore > 8000) ? 95 : 
                           (totalScore > 6000) ? 80 : 
                           (totalScore > 4000) ? 65 : 50;
            }
        }
        
        require(bestProtocol != address(0), "No suitable protocol");
        
        // Cannot emit event in view function
        return (bestProtocol, expectedApy, confidence);
    }
    
    /**
     * @notice Get all active protocols with current data
     */
    function getActiveProtocols() external view returns (
        address[] memory addresses,
        string[] memory names,
        uint256[] memory apys,
        uint256[] memory tvls
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < protocolList.length; i++) {
            if (protocols[protocolList[i]].active) activeCount++;
        }
        
        addresses = new address[](activeCount);
        names = new string[](activeCount);
        apys = new uint256[](activeCount);
        tvls = new uint256[](activeCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < protocolList.length; i++) {
            address protocol = protocolList[i];
            if (protocols[protocol].active) {
                addresses[index] = protocol;
                names[index] = protocols[protocol].name;
                apys[index] = currentYields[protocol].currentApy;
                tvls[index] = currentYields[protocol].tvl;
                index++;
            }
        }
        
        return (addresses, names, apys, tvls);
    }
    
    /**
     * @notice Get detailed yield data for a protocol
     */
    function getProtocolDetails(address protocol) external view returns (
        string memory name,
        uint256 currentApy,
        uint256 tvl,
        uint256 utilizationRate,
        uint256 riskScore,
        uint256 lastUpdate
    ) {
        require(protocols[protocol].active, "Protocol not active");
        
        ProtocolInfo memory info = protocols[protocol];
        YieldData memory yield = currentYields[protocol];
        
        return (
            info.name,
            yield.currentApy,
            yield.tvl,
            yield.utilizationRate,
            info.riskScore,
            yield.lastUpdate
        );
    }
    
    /**
     * @notice Add new protocol (owner only)
     */
    function addProtocol(
        address protocol,
        string memory name,
        uint256 baseApy,
        uint256 riskScore
    ) external onlyOwner {
        require(!protocols[protocol].active, "Already exists");
        require(riskScore <= 1000, "Invalid risk score");
        
        protocols[protocol] = ProtocolInfo({
            name: name,
            baseApy: baseApy,
            riskScore: riskScore,
            tvl: 1000000 * 1e6, // Start with 1M
            active: true
        });
        
        protocolList.push(protocol);
        
        // Initialize current yields
        currentYields[protocol] = YieldData({
            currentApy: baseApy,
            tvl: 1000000 * 1e6,
            utilizationRate: 7500,
            lastUpdate: block.timestamp
        });
        
        emit ProtocolAdded(name, protocol);
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @notice Initialize with default protocols
     */
    function _initializeProtocols() private {
        // Aave V3 Testnet
        address aave = address(uint160(uint256(keccak256("aave.testnet"))));
        protocols[aave] = ProtocolInfo({
            name: "Aave V3",
            baseApy: 650, // 6.5% base
            riskScore: 100, // Very safe
            tvl: 10000000 * 1e6, // 10M
            active: true
        });
        protocolList.push(aave);
        
        // Compound V3 Testnet
        address compound = address(uint160(uint256(keccak256("compound.testnet"))));
        protocols[compound] = ProtocolInfo({
            name: "Compound V3",
            baseApy: 580, // 5.8% base
            riskScore: 150, // Safe
            tvl: 8000000 * 1e6, // 8M
            active: true
        });
        protocolList.push(compound);
        
        // Yearn Finance Testnet
        address yearn = address(uint160(uint256(keccak256("yearn.testnet"))));
        protocols[yearn] = ProtocolInfo({
            name: "Yearn Finance",
            baseApy: 920, // 9.2% base
            riskScore: 300, // Medium risk
            tvl: 5000000 * 1e6, // 5M
            active: true
        });
        protocolList.push(yearn);
        
        // Curve Finance Testnet
        address curve = address(uint160(uint256(keccak256("curve.testnet"))));
        protocols[curve] = ProtocolInfo({
            name: "Curve 3Pool",
            baseApy: 480, // 4.8% base
            riskScore: 200, // Low-medium risk
            tvl: 15000000 * 1e6, // 15M
            active: true
        });
        protocolList.push(curve);
        
        // Initialize current yields
        for (uint256 i = 0; i < protocolList.length; i++) {
            address protocol = protocolList[i];
            ProtocolInfo memory info = protocols[protocol];
            
            currentYields[protocol] = YieldData({
                currentApy: info.baseApy,
                tvl: info.tvl,
                utilizationRate: 7500 + (i * 500), // 75-90%
                lastUpdate: block.timestamp
            });
        }
    }
    
    /**
     * @notice Calculate liquidity score
     */
    function _calculateLiquidityScore(uint256 tvl, uint256 amount) private pure returns (uint256) {
        if (tvl > amount * 1000) return 20; // Max 20 points
        if (tvl > amount * 100) return 15;
        if (tvl > amount * 50) return 10;
        if (tvl > amount * 10) return 5;
        return 0;
    }
}