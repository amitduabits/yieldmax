// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Chainlink Automation Interface
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title AutomatedStrategyEngine
 * @notice Strategy engine with Chainlink Automation for automatic rebalancing
 * @dev Automatically updates yields and rebalances every hour
 */
contract AutomatedStrategyEngine is Ownable, AutomationCompatibleInterface {
    // ==================== STRUCTS ====================
    struct ProtocolInfo {
        string name;
        uint256 baseApy;
        uint256 riskScore;
        uint256 tvl;
        bool active;
    }
    
    struct YieldData {
        uint256 currentApy;
        uint256 tvl;
        uint256 utilizationRate;
        uint256 lastUpdate;
    }
    
    struct RebalanceEvent {
        uint256 timestamp;
        address fromProtocol;
        address toProtocol;
        uint256 amount;
        uint256 reason; // 0: scheduled, 1: yield opportunity, 2: risk mitigation
    }
    
    // ==================== STATE VARIABLES ====================
    mapping(address => ProtocolInfo) public protocols;
    mapping(address => YieldData) public currentYields;
    address[] public protocolList;
    
    // Automation variables
    uint256 public lastRebalanceTime;
    uint256 public rebalanceInterval = 3600; // 1 hour
    uint256 public minYieldDifference = 100; // 1% minimum difference to trigger rebalance
    
    RebalanceEvent[] public rebalanceHistory;
    uint256 public totalRebalances;
    
    // Vault integration
    address public vault;
    address public currentAllocation;
    
    // ==================== EVENTS ====================
    event YieldUpdated(address indexed protocol, uint256 newApy, uint256 tvl);
    event RebalanceTriggered(address indexed from, address indexed to, uint256 reason);
    event AutomationExecuted(uint256 timestamp, uint256 gasUsed);
    
    // ==================== MODIFIERS ====================
    modifier onlyVaultOrOwner() {
        require(msg.sender == vault || msg.sender == owner(), "Unauthorized");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    constructor() Ownable(msg.sender) {
        _initializeProtocols();
        lastRebalanceTime = block.timestamp;
    }
    
    // ==================== CHAINLINK AUTOMATION ====================
    
    /**
     * @notice Check if upkeep is needed
     * @dev Called by Chainlink Automation network
     */
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        upkeepNeeded = false;
        
        // Check 1: Time-based trigger
        if (block.timestamp >= lastRebalanceTime + rebalanceInterval) {
            upkeepNeeded = true;
            performData = abi.encode(0); // Scheduled rebalance
            return (upkeepNeeded, performData);
        }
        
        // Check 2: Yield opportunity trigger
        if (currentAllocation != address(0)) {
            uint256 currentYield = currentYields[currentAllocation].currentApy;
            
            for (uint256 i = 0; i < protocolList.length; i++) {
                address protocol = protocolList[i];
                if (protocol != currentAllocation && protocols[protocol].active) {
                    uint256 protocolYield = currentYields[protocol].currentApy;
                    
                    if (protocolYield > currentYield + minYieldDifference) {
                        upkeepNeeded = true;
                        performData = abi.encode(1, protocol); // Yield opportunity
                        return (upkeepNeeded, performData);
                    }
                }
            }
        }
        
        // Check 3: Risk trigger (utilization too high)
        if (currentAllocation != address(0)) {
            uint256 utilization = currentYields[currentAllocation].utilizationRate;
            if (utilization > 9500) { // >95% utilization is risky
                upkeepNeeded = true;
                performData = abi.encode(2); // Risk mitigation
                return (upkeepNeeded, performData);
            }
        }
        
        return (false, "");
    }
    
    /**
     * @notice Perform upkeep when conditions are met
     * @dev Executes rebalancing logic
     */
    function performUpkeep(bytes calldata performData) external override {
        uint256 gasStart = gasleft();
        
        // Decode the reason for upkeep
        uint256 reason = abi.decode(performData, (uint256));
        
        // Update yields first
        _updateAllYields();
        
        // Find optimal allocation
        (address bestProtocol, ) = _findOptimalProtocol(1000000 * 1e6, 5000); // Default 1M USDC, medium risk
        
        // Record rebalance event
        if (currentAllocation != bestProtocol) {
            rebalanceHistory.push(RebalanceEvent({
                timestamp: block.timestamp,
                fromProtocol: currentAllocation,
                toProtocol: bestProtocol,
                amount: 0, // Would be actual amount in production
                reason: reason
            }));
            
            emit RebalanceTriggered(currentAllocation, bestProtocol, reason);
            
            address oldAllocation = currentAllocation;
            currentAllocation = bestProtocol;
            totalRebalances++;
            
            // In production, this would trigger actual fund movement
            // For now, just update allocation
        }
        
        lastRebalanceTime = block.timestamp;
        
        uint256 gasUsed = gasStart - gasleft();
        emit AutomationExecuted(block.timestamp, gasUsed);
    }
    
    // ==================== EXTERNAL FUNCTIONS ====================
    
    /**
     * @notice Set the vault address
     */
    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }
    
    /**
     * @notice Update rebalance interval
     */
    function setRebalanceInterval(uint256 _interval) external onlyOwner {
        require(_interval >= 300, "Min 5 minutes"); // Minimum 5 minutes
        rebalanceInterval = _interval;
    }
    
    /**
     * @notice Update minimum yield difference
     */
    function setMinYieldDifference(uint256 _difference) external onlyOwner {
        require(_difference <= 1000, "Max 10%");
        minYieldDifference = _difference;
    }
    
    /**
     * @notice Get rebalance history
     */
    function getRebalanceHistory(uint256 limit) external view returns (RebalanceEvent[] memory) {
        uint256 length = rebalanceHistory.length;
        if (limit > length) limit = length;
        
        RebalanceEvent[] memory recent = new RebalanceEvent[](limit);
        for (uint256 i = 0; i < limit; i++) {
            recent[i] = rebalanceHistory[length - limit + i];
        }
        
        return recent;
    }
    
    /**
     * @notice Get automation status
     */
    function getAutomationStatus() external view returns (
        bool needsUpkeep,
        uint256 nextRebalanceTime,
        uint256 totalRebalancesCount,
        address currentProtocol,
        uint256 currentApy
    ) {
        (needsUpkeep, ) = this.checkUpkeep("");
        nextRebalanceTime = lastRebalanceTime + rebalanceInterval;
        totalRebalancesCount = totalRebalances;
        currentProtocol = currentAllocation;
        currentApy = currentAllocation != address(0) ? currentYields[currentAllocation].currentApy : 0;
    }
    
    /**
     * @notice Manual yield update (can be called by anyone)
     */
    function updateYieldData() external returns (bool) {
        _updateAllYields();
        return true;
    }
    
    /**
     * @notice Get optimal strategy
     */
    function getOptimalStrategy(
        uint256 amount,
        uint256 riskTolerance
    ) external view returns (
        address bestProtocol,
        uint256 expectedApy,
        uint256 confidence
    ) {
        (bestProtocol, expectedApy) = _findOptimalProtocol(amount, riskTolerance);
        
        // Calculate confidence based on data freshness and market conditions
        uint256 dataAge = block.timestamp - currentYields[bestProtocol].lastUpdate;
        confidence = dataAge < 3600 ? 95 : dataAge < 7200 ? 80 : 60;
        
        return (bestProtocol, expectedApy, confidence);
    }
    
    /**
     * @notice Get all active protocols
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
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @notice Update all protocol yields
     */
    function _updateAllYields() private {
        for (uint256 i = 0; i < protocolList.length; i++) {
            address protocolAddr = protocolList[i];
            ProtocolInfo memory info = protocols[protocolAddr];
            
            if (!info.active) continue;
            
            // Dynamic yield calculation
            uint256 marketVolatility = (block.timestamp + i) % 100;
            uint256 utilizationImpact = 7000 + (block.number % 3000);
            
            uint256 baseApy = info.baseApy;
            uint256 variance = (baseApy * marketVolatility) / 1000;
            uint256 dynamicApy = block.timestamp % 2 == 0 ? 
                baseApy + variance : 
                baseApy > variance ? baseApy - variance : baseApy;
            
            if (utilizationImpact > 8500) {
                dynamicApy = (dynamicApy * 110) / 100;
            }
            
            currentYields[protocolAddr] = YieldData({
                currentApy: dynamicApy,
                tvl: info.tvl + (block.number % 1000) * 1e6,
                utilizationRate: utilizationImpact,
                lastUpdate: block.timestamp
            });
            
            emit YieldUpdated(protocolAddr, dynamicApy, currentYields[protocolAddr].tvl);
        }
    }
    
    /**
     * @notice Find optimal protocol
     */
    function _findOptimalProtocol(
        uint256 amount,
        uint256 riskTolerance
    ) private view returns (address, uint256) {
        uint256 bestScore = 0;
        address bestProtocol = protocolList[0];
        uint256 bestApy = 0;
        
        for (uint256 i = 0; i < protocolList.length; i++) {
            address protocol = protocolList[i];
            ProtocolInfo memory info = protocols[protocol];
            YieldData memory yield = currentYields[protocol];
            
            if (!info.active || yield.tvl < amount * 10) continue;
            
            uint256 score = _calculateProtocolScore(
                yield.currentApy,
                info.riskScore,
                yield.tvl,
                amount,
                riskTolerance
            );
            
            if (score > bestScore) {
                bestScore = score;
                bestProtocol = protocol;
                bestApy = yield.currentApy;
            }
        }
        
        return (bestProtocol, bestApy);
    }
    
    /**
     * @notice Calculate protocol score
     */
    function _calculateProtocolScore(
        uint256 apy,
        uint256 riskScore,
        uint256 tvl,
        uint256 amount,
        uint256 riskTolerance
    ) private pure returns (uint256) {
        uint256 apyScore = (apy * 40) / 100;
        uint256 safetyScore = ((1000 - riskScore) * 30) / 1000;
        uint256 liquidityScore = tvl > amount * 100 ? 20 : 10;
        
        uint256 totalScore = apyScore + safetyScore + liquidityScore;
        
        if (riskTolerance < 3000) {
            totalScore = (totalScore * 60 + safetyScore * 40) / 100;
        } else if (riskTolerance > 7000) {
            totalScore = (totalScore * 60 + apyScore * 40) / 100;
        }
        
        return totalScore;
    }
    
    /**
     * @notice Initialize protocols
     */
    function _initializeProtocols() private {
        // Same as before - Aave, Compound, Yearn, Curve
        address aave = address(uint160(uint256(keccak256("aave.testnet"))));
        protocols[aave] = ProtocolInfo({
            name: "Aave V3",
            baseApy: 650,
            riskScore: 100,
            tvl: 10000000 * 1e6,
            active: true
        });
        protocolList.push(aave);
        currentAllocation = aave; // Start with Aave
        
        address compound = address(uint160(uint256(keccak256("compound.testnet"))));
        protocols[compound] = ProtocolInfo({
            name: "Compound V3",
            baseApy: 580,
            riskScore: 150,
            tvl: 8000000 * 1e6,
            active: true
        });
        protocolList.push(compound);
        
        address yearn = address(uint160(uint256(keccak256("yearn.testnet"))));
        protocols[yearn] = ProtocolInfo({
            name: "Yearn Finance",
            baseApy: 920,
            riskScore: 300,
            tvl: 5000000 * 1e6,
            active: true
        });
        protocolList.push(yearn);
        
        address curve = address(uint160(uint256(keccak256("curve.testnet"))));
        protocols[curve] = ProtocolInfo({
            name: "Curve 3Pool",
            baseApy: 480,
            riskScore: 200,
            tvl: 15000000 * 1e6,
            active: true
        });
        protocolList.push(curve);
        
        // Initialize yields
        _updateAllYields();
    }
}