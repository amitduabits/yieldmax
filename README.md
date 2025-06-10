# YieldMax - Cross-Chain DeFi Yield Optimizer

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- MetaMask wallet

### Installation

1. Install dependencies:
```bash
npm install
cd frontend && npm install
cd ../contracts && npm install
cd ..
```

2. Set up environment variables:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp contracts/.env.example contracts/.env
# Edit the .env files with your API keys
```

3. Run the development server:
```bash
# In the root directory
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Architecture

- **Frontend**: Next.js 14, React 18, TypeScript, Styled Components
- **Smart Contracts**: Solidity 0.8.19, Hardhat, OpenZeppelin
- **Blockchain**: Ethereum, Arbitrum, Polygon, Optimism
- **Integrations**: Chainlink CCIP, RainbowKit, Wagmi

## 📝 License

MIT License
