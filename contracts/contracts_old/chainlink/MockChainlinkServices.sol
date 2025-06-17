// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Mock Chainlink services for testnet
contract MockAutomation {
    mapping(address => bool) public upkeeps;
    
    function registerUpkeep(address target) external returns (uint256) {
        upkeeps[target] = true;
        return uint256(keccak256(abi.encodePacked(target, block.timestamp)));
    }
    
    function checkUpkeep(bytes calldata) external view returns (bool, bytes memory) {
        return (true, "");
    }
    
    function performUpkeep(bytes calldata) external {
        // Mock upkeep performed
    }
}

contract MockFunctions {
    mapping(bytes32 => bytes) public responses;
    
    function sendRequest(
        bytes memory source,
        bytes memory secrets,
        string[] memory args,
        uint64 subscriptionId,
        uint32 gasLimit
    ) external returns (bytes32) {
        bytes32 requestId = keccak256(abi.encodePacked(block.timestamp, msg.sender));
        // Simulate AI response with 25% APY
        responses[requestId] = abi.encode(2500);
        return requestId;
    }
    
    function getResponse(bytes32 requestId) external view returns (bytes memory) {
        return responses[requestId];
    }
}

contract MockDataStreams {
    struct YieldData {
        uint256 aaveYield;
        uint256 compoundYield;
        uint256 gmxYield;
        uint256 timestamp;
    }
    
    mapping(string => YieldData) public yields;
    
    constructor() {
        // Initialize with mock data
        yields["USDC-AAVE"] = YieldData(550, 0, 0, block.timestamp); // 5.5% APY
        yields["USDC-COMPOUND"] = YieldData(0, 420, 0, block.timestamp); // 4.2% APY
        yields["USDC-GMX"] = YieldData(0, 0, 2500, block.timestamp); // 25% APY
    }
    
    function getLatestYield(string memory protocol) external view returns (uint256) {
        if (keccak256(bytes(protocol)) == keccak256(bytes("USDC-AAVE"))) {
            return yields["USDC-AAVE"].aaveYield;
        } else if (keccak256(bytes(protocol)) == keccak256(bytes("USDC-COMPOUND"))) {
            return yields["USDC-COMPOUND"].compoundYield;
        } else if (keccak256(bytes(protocol)) == keccak256(bytes("USDC-GMX"))) {
            return yields["USDC-GMX"].gmxYield;
        }
        return 0;
    }
}