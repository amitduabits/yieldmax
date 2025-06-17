// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ConfirmedOwner {
    address private s_owner;

    event OwnershipTransferred(address indexed from, address indexed to);

    constructor(address newOwner) {
        require(newOwner != address(0), "Owner cannot be zero address");
        s_owner = newOwner;
        emit OwnershipTransferred(address(0), newOwner);
    }

    modifier onlyOwner() {
        require(msg.sender == s_owner, "Not the owner");
        _;
    }

    function transferOwnership(address to) public onlyOwner {
        require(to != address(0), "Owner cannot be zero address");
        emit OwnershipTransferred(s_owner, to);
        s_owner = to;
    }

    function owner() public view returns (address) {
        return s_owner;
    }
}
