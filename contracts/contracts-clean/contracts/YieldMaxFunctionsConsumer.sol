// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldMaxFunctionsConsumer
 * @notice Chainlink Functions consumer for real-time DeFi yield data
 * @dev Integrates with multiple DeFi protocols for yield optimization
 */
contract YieldMaxFunctionsConsumer is FunctionsClient, AccessControl, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;

    // ==================== ROLES ====================
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");

    // ==================== STRUCTS ====================
    struct YieldData {
        uint256 aaveAPY;
        uint256 compoundAPY;
        uint256 yearnAPY;
        uint256 curveAPY;
        uint256 lastUpdate;
        bool isValid;
    }

    struct ProtocolConfig {
        string apiEndpoint;
        uint256 weight; // Weight in basis points (10000 = 100%)
        bool isActive;
    }

    struct RequestConfig {
        uint32 gasLimit;
        uint64 subscriptionId;
        bytes32 donId;
        uint8 secretsSlotId;
        uint64 secretsVersion;
    }

    // ==================== STATE VARIABLES ====================
    YieldData public currentYields;
    RequestConfig public requestConfig;
    
    mapping(string => ProtocolConfig) public protocolConfigs;
    mapping(bytes32 => bool) public pendingRequests;
    
    string[] public supportedProtocols;
    string public jsSource;

    // ==================== EVENTS ====================
    event YieldDataUpdated(
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY,
        uint256 timestamp
    );
    
    event RequestSent(bytes32 indexed requestId, string[] protocols);
    event RequestFulfilled(bytes32 indexed requestId, bytes response, bytes err);
    event ProtocolConfigUpdated(string protocol, string endpoint, uint256 weight);

    // ==================== ERRORS ====================
    error UnauthorizedRequest();
    error InvalidResponse();
    error RequestAlreadyPending();
    error NoActiveProtocols();

    // ==================== CONSTRUCTOR ====================
    constructor(
        address router,
        uint64 subscriptionId,
        bytes32 donId
    ) FunctionsClient(router) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);

        requestConfig = RequestConfig({
            gasLimit: 300000,
            subscriptionId: subscriptionId,
            donId: donId,
            secretsSlotId: 0,
            secretsVersion: 0
        });

        // Initialize supported protocols
        supportedProtocols = ["aave", "compound", "yearn", "curve"];
        
        // Set default JavaScript source
        _initializeJavaScript();
        
        // Initialize protocol configs
        _initializeProtocolConfigs();
    }

    // ==================== MAIN FUNCTIONS ====================

    /**
     * @notice Request yield data from multiple DeFi protocols
     * @return requestId The ID of the Chainlink Functions request
     */
    function requestYieldData() external onlyRole(KEEPER_ROLE) returns (bytes32) {
        // Create the Functions request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(jsSource);
        
        // Set request arguments
        string[] memory args = new string[](supportedProtocols.length);
        for (uint256 i = 0; i < supportedProtocols.length; i++) {
            args[i] = supportedProtocols[i];
        }
        req.setArgs(args);

        // Send the request
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            requestConfig.subscriptionId,
            requestConfig.gasLimit,
            requestConfig.donId
        );

        pendingRequests[requestId] = true;
        emit RequestSent(requestId, supportedProtocols);
        
        return requestId;
    }

    /**
     * @notice Callback function for Chainlink Functions responses
     * @param requestId The ID of the request
     * @param response The response data
     * @param err Any error data
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (!pendingRequests[requestId]) {
            revert UnauthorizedRequest();
        }

        delete pendingRequests[requestId];
        emit RequestFulfilled(requestId, response, err);

        if (err.length > 0) {
            // Handle error - could log or emit event
            return;
        }

        if (response.length < 128) { // Expecting 4 * 32 bytes for uint256 values
            revert InvalidResponse();
        }

        // Decode response: [aaveAPY, compoundAPY, yearnAPY, curveAPY]
        (uint256 aaveAPY, uint256 compoundAPY, uint256 yearnAPY, uint256 curveAPY) = 
            abi.decode(response, (uint256, uint256, uint256, uint256));

        // Update yield data
        currentYields = YieldData({
            aaveAPY: aaveAPY,
            compoundAPY: compoundAPY,
            yearnAPY: yearnAPY,
            curveAPY: curveAPY,
            lastUpdate: block.timestamp,
            isValid: true
        });

        emit YieldDataUpdated(aaveAPY, compoundAPY, yearnAPY, curveAPY, block.timestamp);
    }

    /**
     * @notice Get the best yield opportunity based on current data
     * @param amount Amount to invest
     * @return protocol Best protocol name
     * @return expectedAPY Expected APY in basis points
     */
    function getBestYield(uint256 amount) 
        external 
        view 
        returns (string memory protocol, uint256 expectedAPY) 
    {
        require(currentYields.isValid, "No valid yield data");
        
        uint256 bestAPY = 0;
        string memory bestProtocol = "";

        // Compare all active protocols
        if (protocolConfigs["aave"].isActive && currentYields.aaveAPY > bestAPY) {
            bestAPY = currentYields.aaveAPY;
            bestProtocol = "aave";
        }
        
        if (protocolConfigs["compound"].isActive && currentYields.compoundAPY > bestAPY) {
            bestAPY = currentYields.compoundAPY;
            bestProtocol = "compound";
        }
        
        if (protocolConfigs["yearn"].isActive && currentYields.yearnAPY > bestAPY) {
            bestAPY = currentYields.yearnAPY;
            bestProtocol = "yearn";
        }
        
        if (protocolConfigs["curve"].isActive && currentYields.curveAPY > bestAPY) {
            bestAPY = currentYields.curveAPY;
            bestProtocol = "curve";
        }

        return (bestProtocol, bestAPY);
    }

    /**
     * @notice Get current yield data for all protocols
     * @return Current yield data struct
     */
    function getCurrentYields() external view returns (YieldData memory) {
        return currentYields;
    }

    /**
     * @notice Check if yield data is fresh (updated within last hour)
     * @return true if data is fresh, false otherwise
     */
    function isDataFresh() external view returns (bool) {
        return currentYields.isValid && 
               (block.timestamp - currentYields.lastUpdate) <= 3600; // 1 hour
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @notice Update JavaScript source code for Functions
     * @param newSource New JavaScript source code
     */
    function updateJavaScript(string memory newSource) 
        external 
        onlyRole(STRATEGIST_ROLE) 
    {
        jsSource = newSource;
    }

    /**
     * @notice Update protocol configuration
     * @param protocol Protocol name
     * @param endpoint API endpoint
     * @param weight Weight in basis points
     * @param isActive Whether protocol is active
     */
    function updateProtocolConfig(
        string memory protocol,
        string memory endpoint,
        uint256 weight,
        bool isActive
    ) external onlyRole(STRATEGIST_ROLE) {
        protocolConfigs[protocol] = ProtocolConfig({
            apiEndpoint: endpoint,
            weight: weight,
            isActive: isActive
        });
        
        emit ProtocolConfigUpdated(protocol, endpoint, weight);
    }

    /**
     * @notice Update request configuration
     * @param gasLimit Gas limit for requests
     * @param subscriptionId Subscription ID
     * @param donId DON ID
     */
    function updateRequestConfig(
        uint32 gasLimit,
        uint64 subscriptionId,
        bytes32 donId
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        requestConfig.gasLimit = gasLimit;
        requestConfig.subscriptionId = subscriptionId;
        requestConfig.donId = donId;
    }

    /**
     * @notice Emergency function to manually set yield data
     * @dev Only for testing or emergency situations
     */
    function setEmergencyYieldData(
        uint256 aaveAPY,
        uint256 compoundAPY,
        uint256 yearnAPY,
        uint256 curveAPY
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        currentYields = YieldData({
            aaveAPY: aaveAPY,
            compoundAPY: compoundAPY,
            yearnAPY: yearnAPY,
            curveAPY: curveAPY,
            lastUpdate: block.timestamp,
            isValid: true
        });
        
        emit YieldDataUpdated(aaveAPY, compoundAPY, yearnAPY, curveAPY, block.timestamp);
    }

    // ==================== INTERNAL FUNCTIONS ====================

    /**
     * @notice Initialize JavaScript source for Chainlink Functions
     */
    function _initializeJavaScript() internal {
        jsSource = string(abi.encodePacked(
            "// YieldMax DeFi Protocol Data Fetcher\n",
            "const protocols = args;\n",
            "const results = [];\n\n",
            "// Mock data for demo - replace with real API calls\n",
            "const mockData = {\n",
            "  aave: 702,      // 7.02% APY\n",
            "  compound: 626,  // 6.26% APY\n",
            "  yearn: 995,     // 9.95% APY\n",
            "  curve: 519      // 5.19% APY\n",
            "};\n\n",
            "// In production, replace with real API calls:\n",
            "// const aaveResponse = await Functions.makeHttpRequest({\n",
            "//   url: 'https://api.aave.com/data/reserve-data',\n",
            "//   method: 'GET',\n",
            "//   headers: { 'Authorization': secrets.aaveApiKey }\n",
            "// });\n\n",
            "for (const protocol of protocols) {\n",
            "  results.push(mockData[protocol] || 0);\n",
            "}\n\n",
            "return Functions.encodeUint256(results[0] || 0) +\n",
            "       Functions.encodeUint256(results[1] || 0) +\n",
            "       Functions.encodeUint256(results[2] || 0) +\n",
            "       Functions.encodeUint256(results[3] || 0);"
        ));
    }

    /**
     * @notice Initialize protocol configurations
     */
    function _initializeProtocolConfigs() internal {
        protocolConfigs["aave"] = ProtocolConfig({
            apiEndpoint: "https://api.aave.com/data/reserve-data",
            weight: 2500, // 25%
            isActive: true
        });
        
        protocolConfigs["compound"] = ProtocolConfig({
            apiEndpoint: "https://api.compound.finance/v2/ctoken",
            weight: 2500, // 25%
            isActive: true
        });
        
        protocolConfigs["yearn"] = ProtocolConfig({
            apiEndpoint: "https://api.yearn.finance/v1/chains/1/vaults/all",
            weight: 2500, // 25%
            isActive: true
        });
        
        protocolConfigs["curve"] = ProtocolConfig({
            apiEndpoint: "https://api.curve.fi/api/getPools/ethereum/main",
            weight: 2500, // 25%
            isActive: true
        });
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @notice Get supported protocols
     * @return Array of supported protocol names
     */
    function getSupportedProtocols() external view returns (string[] memory) {
        return supportedProtocols;
    }

    /**
     * @notice Get protocol configuration
     * @param protocol Protocol name
     * @return Protocol configuration struct
     */
    function getProtocolConfig(string memory protocol) 
        external 
        view 
        returns (ProtocolConfig memory) 
    {
        return protocolConfigs[protocol];
    }

    /**
     * @notice Check if a request is pending
     * @param requestId Request ID to check
     * @return true if request is pending
     */
    function isRequestPending(bytes32 requestId) external view returns (bool) {
        return pendingRequests[requestId];
    }

    /**
     * @notice Get weighted average APY across all protocols
     * @return Weighted average APY in basis points
     */
    function getWeightedAverageAPY() external view returns (uint256) {
        if (!currentYields.isValid) return 0;
        
        uint256 totalWeight = 0;
        uint256 weightedSum = 0;
        
        if (protocolConfigs["aave"].isActive) {
            uint256 weight = protocolConfigs["aave"].weight;
            weightedSum += currentYields.aaveAPY * weight;
            totalWeight += weight;
        }
        
        if (protocolConfigs["compound"].isActive) {
            uint256 weight = protocolConfigs["compound"].weight;
            weightedSum += currentYields.compoundAPY * weight;
            totalWeight += weight;
        }
        
        if (protocolConfigs["yearn"].isActive) {
            uint256 weight = protocolConfigs["yearn"].weight;
            weightedSum += currentYields.yearnAPY * weight;
            totalWeight += weight;
        }
        
        if (protocolConfigs["curve"].isActive) {
            uint256 weight = protocolConfigs["curve"].weight;
            weightedSum += currentYields.curveAPY * weight;
            totalWeight += weight;
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
}