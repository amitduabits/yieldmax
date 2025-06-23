// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockChainlinkAutomation {
    mapping(address => uint256) public upkeepIds;
    uint256 private nextUpkeepId = 1;
    
    function registerUpkeep(
        address target,
        uint32 gasLimit,
        address adminAddress,
        bytes calldata checkData,
        uint96 amount,
        uint8 source
    ) external returns (uint256 upkeepId) {
        upkeepId = nextUpkeepId++;
        upkeepIds[target] = upkeepId;
        return upkeepId;
    }
    
    function getUpkeep(uint256 upkeepId) external view returns (
        address target,
        uint32 executeGas,
        bytes memory checkData,
        uint96 balance,
        address lastKeeper,
        address admin,
        uint64 maxValidBlocknumber,
        uint96 amountSpent
    ) {
        // Return mock data
        return (
            address(this),
            200000,
            "",
            10 ether,
            address(this),
            address(this),
            0,
            0
        );
    }
}