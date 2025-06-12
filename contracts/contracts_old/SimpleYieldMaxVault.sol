// contracts/SimpleYieldMaxVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleYieldMaxVault is ERC4626, Ownable {
    address public keeper;
    uint256 public lastHarvest;
    uint256 public totalYieldEarned;
    
    event Harvest(uint256 amount, uint256 timestamp);
    event KeeperUpdated(address newKeeper);

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "Not keeper");
        _;
    }

    constructor(
        address _asset
    ) ERC4626(IERC20(_asset)) ERC20("YieldMax USDC Vault", "ymUSDC") Ownable(msg.sender) {
        keeper = msg.sender;
        lastHarvest = block.timestamp;
    }

    function setKeeper(address _keeper) external onlyOwner {
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }

    function harvest() external onlyKeeper {
        uint256 currentBalance = IERC20(asset()).balanceOf(address(this));
        uint256 totalManaged = totalAssets();
        
        if (currentBalance > totalManaged) {
            uint256 yield = currentBalance - totalManaged;
            totalYieldEarned += yield;
            lastHarvest = block.timestamp;
            emit Harvest(yield, block.timestamp);
        }
    }

    function getYieldEarnedPerShare() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 0;
        return (totalYieldEarned * 1e18) / supply;
    }

    // Override totalAssets to include any yield
    function totalAssets() public view virtual override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }
}