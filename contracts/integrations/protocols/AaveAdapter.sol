// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ProtocolAdapters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IAToken {
    function balanceOf(address user) external view returns (uint256);
}

contract AaveAdapter is BaseProtocolAdapter {
    IAavePool public immutable aavePool;
    mapping(address => address) public aTokens;
    
    constructor(address _vault, address _aavePool) BaseProtocolAdapter(_vault) {
        aavePool = IAavePool(_aavePool);
    }
    
    function deposit(address asset, uint256 amount) external override onlyVault returns (uint256) {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(asset).safeApprove(address(aavePool), amount);
        
        uint256 balanceBefore = getBalance(asset, address(this));
        aavePool.supply(asset, amount, address(this), 0);
        uint256 balanceAfter = getBalance(asset, address(this));
        
        return balanceAfter - balanceBefore;
    }
    
    function withdraw(address asset, uint256 amount) external override onlyVault returns (uint256) {
        uint256 withdrawn = aavePool.withdraw(asset, amount, msg.sender);
        return withdrawn;
    }
    
    function getBalance(address asset, address user) public view override returns (uint256) {
        address aToken = aTokens[asset];
        if (aToken == address(0)) return 0;
        return IAToken(aToken).balanceOf(user);
    }
    
    function getCurrentAPY() external pure override returns (uint256) {
        // In production, fetch from Aave data provider
        return 520; // 5.2%
    }
    
    function getProtocolName() external pure override returns (string memory) {
        return "Aave";
    }
    
    function setAToken(address asset, address aToken) external {
        require(msg.sender == vault, "Only vault");
        aTokens[asset] = aToken;
    }
}