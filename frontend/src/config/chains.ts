import { sepolia, arbitrumSepolia } from 'viem/chains'

export const supportedChains = [sepolia, arbitrumSepolia] as const
export type SupportedChain = typeof supportedChains[number]