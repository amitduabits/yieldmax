require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/hardhat-chainlink");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY";
const ARBITRUM_SEPOLIA_RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://arb-sepolia.g.alchemy.com/v2/YOUR-API-KEY";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: SEPOLIA_RPC_URL,
        blockNumber: 4500000
      }
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasPrice: 20000000000, // 20 gwei
      gasMultiplier: 1.2
    },
    arbitrumSepolia: {
      url: ARBITRUM_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 421614,
      gasPrice: 100000000, // 0.1 gwei
      gasMultiplier: 1.2
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      arbitrumSepolia: ARBISCAN_API_KEY
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};



// require("@nomicfoundation/hardhat-toolbox");
// require("dotenv").config();

// module.exports = {
//   solidity: {
//     version: "0.8.19",
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 200
//       }
//     }
//   },
//   networks: {
//     hardhat: {
//       forking: {
//         url: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
//         blockNumber: 18900000
//       }
//     },
//     ethereum: {
//       url: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
//       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
//     },
//     arbitrum: {
//       url: process.env.ARBITRUM_RPC_URL || "https://arb-mainnet.alchemyapi.io/v2/your-api-key",
//       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
//     },
//     polygon: {
//       url: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.alchemyapi.io/v2/your-api-key",
//       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
//     },
//     optimism: {
//       url: process.env.OPTIMISM_RPC_URL || "https://opt-mainnet.alchemyapi.io/v2/your-api-key",
//       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
//     }
//   },
//   etherscan: {
//     apiKey: {
//       mainnet: process.env.ETHERSCAN_API_KEY || "YOUR_KEY",
//       arbitrumOne: process.env.ARBISCAN_API_KEY || "YOUR_KEY",
//       polygon: process.env.POLYGONSCAN_API_KEY || "YOUR_KEY",
//       optimisticEthereum: process.env.OPTIMISM_API_KEY || "YOUR_KEY"
//     }
//   }
// };
