// contracts/test/FlashLoanTester.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

contract FlashLoanTester is FlashLoanSimpleReceiverBase {
    address public yieldMaxVault;
    
    constructor(
        address _addressProvider,
        address _yieldMaxVault
    ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        yieldMaxVault = _yieldMaxVault;
    }
    
    function testLargeDeposit(address asset, uint256 amount) external {
        // Request flash loan
        POOL.flashLoanSimple(
            address(this),
            asset,
            amount,
            "",
            0
        );
    }
    
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // 1. Approve YieldMax
        IERC20(asset).approve(yieldMaxVault, amount);
        
        // 2. Deposit to YieldMax
        IYieldMaxVault(yieldMaxVault).deposit(amount, address(this));
        
        // 3. Trigger rebalance to test cross-chain
        IYieldMaxVault(yieldMaxVault).requestRebalance();
        
        // 4. Withdraw (for testing instant withdraw)
        uint256 shares = IYieldMaxVault(yieldMaxVault).balanceOf(address(this));
        IYieldMaxVault(yieldMaxVault).withdraw(shares, address(this));
        
        // 5. Approve for flash loan repayment
        uint256 totalDebt = amount + premium;
        IERC20(asset).approve(address(POOL), totalDebt);
        
        return true;
    }
}
