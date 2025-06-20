// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IChainlinkAPYFeed {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 apy,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

contract OracleManager is Ownable {
    // Chainlink Price Feeds (Sepolia addresses)
    AggregatorV3Interface public constant ETH_USD = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    AggregatorV3Interface public constant USDC_USD = AggregatorV3Interface(0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E);
    
    struct YieldData {
        uint256 apy;
        uint256 tvl;
        uint256 utilizationRate;
        uint256 lastUpdate;
        address dataSource;
    }
    
    // Protocol yield data
    mapping(string => YieldData) public protocolYields;
    mapping(string => address) public apyFeeds; // Chainlink APY feed addresses
    
    // Events
    event YieldDataUpdated(string protocol, uint256 apy, uint256 tvl, uint256 utilization);
    event OracleAdded(string protocol, address oracle);
    
    // Constants
    uint256 public constant STALE_THRESHOLD = 3600; // 1 hour
    
    constructor() {
        _initializeOracles();
    }
    
    function _initializeOracles() private {
        // In production, these would be actual Chainlink APY oracle addresses
        // For now, we'll use price feeds as proxies and calculate APYs
        
        // Initialize with base yields
        protocolYields["Aave"] = YieldData({
            apy: 652, // 6.52%
            tvl: 11100000000, // $11.1B in USDC (6 decimals)
            utilizationRate: 7710, // 77.10%
            lastUpdate: block.timestamp,
            dataSource: address(ETH_USD) // Placeholder
        });
        
        protocolYields["Compound"] = YieldData({
            apy: 582,
            tvl: 8880000000,
            utilizationRate: 7710,
            lastUpdate: block.timestamp,
            dataSource: address(USDC_USD)
        });
        
        protocolYields["Yearn"] = YieldData({
            apy: 925,
            tvl: 5550000000,
            utilizationRate: 7710,
            lastUpdate: block.timestamp,
            dataSource: address(0)
        });
        
        protocolYields["Curve"] = YieldData({
            apy: 483,
            tvl: 16650000000,
            utilizationRate: 7710,
            lastUpdate: block.timestamp,
            dataSource: address(0)
        });
    }
    
    function updateYieldData() external {
        // Update Aave yields
        _updateProtocolYield("Aave");
        _updateProtocolYield("Compound");
        _updateProtocolYield("Yearn");
        _updateProtocolYield("Curve");
    }
    
    function _updateProtocolYield(string memory protocol) private {
        YieldData storage data = protocolYields[protocol];
        
        // In production: Fetch from real Chainlink APY oracles
        // For now, simulate realistic yield changes based on market conditions
        uint256 marketVolatility = _getMarketVolatility();
        
        // Calculate new APY with market-based variations
        uint256 baseAPY = data.apy;
        uint256 variation = (marketVolatility * baseAPY) / 10000; // Max 1% variation
        
        // Add some randomness based on block
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, protocol))) % variation;
        
        if (block.timestamp % 2 == 0) {
            data.apy = baseAPY + random;
        } else {
            data.apy = baseAPY > random ? baseAPY - random : baseAPY;
        }
        
        // Update TVL based on ETH price movements
        (, int256 ethPrice,,,) = ETH_USD.latestRoundData();
        data.tvl = (data.tvl * uint256(ethPrice)) / 200000000; // Adjust for price impact
        
        // Update utilization (would come from protocol in production)
        data.utilizationRate = 7500 + (random % 500); // 75-80%
        
        data.lastUpdate = block.timestamp;
        
        emit YieldDataUpdated(protocol, data.apy, data.tvl, data.utilizationRate);
    }
    
    function _getMarketVolatility() private view returns (uint256) {
        // In production: Calculate from price feed volatility
        // For now, return a reasonable volatility score
        return 100; // 1% max variation
    }
    
    function getLatestYieldData() external view returns (
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY,
        uint256 lastUpdate
    ) {
        return (
            protocolYields["Aave"].apy,
            protocolYields["Compound"].apy,
            protocolYields["Yearn"].apy,
            protocolYields["Curve"].apy,
            block.timestamp
        );
    }
    
    function getProtocolData(string calldata protocol) external view returns (
        uint256 apy,
        uint256 tvl,
        uint256 utilizationRate,
        uint256 lastUpdate,
        bool isStale
    ) {
        YieldData memory data = protocolYields[protocol];
        bool stale = block.timestamp - data.lastUpdate > STALE_THRESHOLD;
        
        return (data.apy, data.tvl, data.utilizationRate, data.lastUpdate, stale);
    }
    
    function isDataFresh() external view returns (bool) {
        return (
            block.timestamp - protocolYields["Aave"].lastUpdate < STALE_THRESHOLD &&
            block.timestamp - protocolYields["Compound"].lastUpdate < STALE_THRESHOLD &&
            block.timestamp - protocolYields["Yearn"].lastUpdate < STALE_THRESHOLD &&
            block.timestamp - protocolYields["Curve"].lastUpdate < STALE_THRESHOLD
        );
    }
    
    // Admin functions
    function addAPYOracle(string memory protocol, address oracleAddress) external onlyOwner {
        apyFeeds[protocol] = oracleAddress;
        emit OracleAdded(protocol, oracleAddress);
    }
    
    function updateProtocolDataSource(string memory protocol, address newSource) external onlyOwner {
        protocolYields[protocol].dataSource = newSource;
    }
    
    // Emergency functions
    function setManualAPY(string memory protocol, uint256 apy) external onlyOwner {
        require(apy < 10000, "APY too high"); // Max 100%
        protocolYields[protocol].apy = apy;
        protocolYields[protocol].lastUpdate = block.timestamp;
    }
}