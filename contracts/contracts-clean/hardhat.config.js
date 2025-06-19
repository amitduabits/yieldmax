// hardhat.config.js - Updated for multi-chain deployment
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy-arbitrum", "Deploy to Arbitrum Sepolia", async (taskArgs, hre) => {
  await hre.run("compile");
  await hre.run("run", { script: "scripts/deploy-arbitrum-sepolia.js" });
});

task("setup-automation", "Setup Chainlink Automation", async (taskArgs, hre) => {
  await hre.run("run", { script: "scripts/setup-chainlink-automation.js" });
});

task("setup-functions", "Setup Chainlink Functions", async (taskArgs, hre) => {
  await hre.run("run", { script: "scripts/setup-chainlink-functions.js" });
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 20000000000, // 20 gwei
      gas: 6000000
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://arb-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
      gasPrice: 100000000, // 0.1 gwei (Arbitrum is cheaper)
      gas: 10000000
    },
    // Mainnet networks (for future production deployment)
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: 30000000000, // 30 gwei
      gas: 6000000
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "https://arb-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 42161,
      gasPrice: 100000000, // 0.1 gwei
      gas: 10000000
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 30000000000, // 30 gwei
      gas: 8000000
    },
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "https://opt-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 10,
      gasPrice: 15000000, // 0.015 gwei (Optimism is very cheap)
      gas: 8000000
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      optimisticEthereum: process.env.OPTIMISTIC_ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};