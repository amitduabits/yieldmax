// frontend/src/config/contracts.ts
export const CONTRACTS = {
  11155111: { // Sepolia
    vault: '0x0F9D181023b09Ea75Ce8E7c988B8C318e9f31cAe', // Your new ERC4626 vault!
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  },
  421614: { // Arbitrum Sepolia  
    vault: '0x7043148386eD44Df90905a3f1379C1E36eF9c49E', // Keep old one for now
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
  }
} as const

export type ChainId = keyof typeof CONTRACTS