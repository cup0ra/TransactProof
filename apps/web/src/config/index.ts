import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, base, baseSepolia, polygon, optimism, zkSync, bsc, avalanche } from '@reown/appkit/networks'

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'
export const isDev = process.env.NODE_ENV === 'development'
export const PAYMENT_AMOUNT = process.env.NEXT_PUBLIC_PAYMENT_AMOUNT ? parseFloat(process.env.NEXT_PUBLIC_PAYMENT_AMOUNT) : 0.1

const devNentwork = [
  mainnet,
  base,
  baseSepolia,
  polygon,
  arbitrum,
  optimism,
  zkSync,
  bsc,
  avalanche
]

const prodNentwork = [
  mainnet,
  base,
  polygon,
  arbitrum,
  optimism,
  zkSync,
  bsc,
  avalanche
]

export const networks = isDev ? devNentwork : prodNentwork

// Application configuration
export const APP_CONFIG = {
  DEFAULT_CHAIN_ID: process.env.NEXT_PUBLIC_BASE_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_BASE_CHAIN_ID) : 8453, // Base Mainnet
  PAYMENT_OPTIONS: [
    ...(isDev ? [{
      type: 'ETH',
      amount: 0.0000001,
      symbol: 'ETH',
      name: 'Ethereum',
      contractAddress: null,
      supportedNetworks: [1, 8453, 84532, 137, 10, 42161, 324, 56, 43114],
    }] : []),
    {
      type: 'USDT',
      amount: PAYMENT_AMOUNT,
      symbol: 'USDT',
      name: 'Tether USD',
      contractAddresses: {
        1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',     // Ethereum Mainnet
        8453: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',   // Base Mainnet  
        84532: '0x0000000000000000000000000000000000000000',  // Base Sepolia (test)
        137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',   // Polygon Mainnet
        10: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',    // Optimism Mainnet
        42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum One
        324: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',   // zkSync Era
        56: '0x55d398326f99059fF775485246999027B3197955',    // BNB Smart Chain
        43114: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // Avalanche C-Chain
      },
      decimals: {
        1: 6,     // Ethereum: 6 decimals
        8453: 6,  // Base: 6 decimals
        84532: 6, // Base Sepolia: 6 decimals
        137: 6,   // Polygon: 6 decimals
        10: 6,    // Optimism: 6 decimals
        42161: 6, // Arbitrum: 6 decimals
        324: 6,   // zkSync Era: 6 decimals
        56: 18,   // BNB Smart Chain: 18 decimals
        43114: 6, // Avalanche: 6 decimals
      },
      supportedNetworks: [1, 8453, 137, 10, 42161, 324, 56, 43114], // Added new networks
    },
    {
      type: 'USDC',
      amount: PAYMENT_AMOUNT,
      symbol: 'USDC',
      name: 'USD Coin',
      contractAddresses: {
        1: '0xA0b86a33E6351b8B8B53EEbF3C7F65b3e9B5AE8D',     // Ethereum Mainnet (USDC)
        8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base Mainnet (USDC)
        84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',  // Base Sepolia (USDC)
        137: '0x2791Bca1f2de4661ED88A30c99A7a9449Aa84174',   // Polygon Mainnet (USDC - Bridged)
        10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',    // Optimism Mainnet (USDC)
        42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum One (USDC)
        324: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',   // zkSync Era (USDC)
        56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',    // BNB Smart Chain (USDC)
        43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche C-Chain (USDC)
      },
      decimals: {
        1: 6,     // Ethereum: 6 decimals
        8453: 6,  // Base: 6 decimals
        84532: 6, // Base Sepolia: 6 decimals
        137: 6,   // Polygon: 6 decimals
        10: 6,    // Optimism: 6 decimals
        42161: 6, // Arbitrum: 6 decimals
        324: 6,   // zkSync Era: 6 decimals
        56: 18,   // BNB Smart Chain: 18 decimals
        43114: 6, // Avalanche: 6 decimals
      },
      supportedNetworks: [1, 8453, 84532, 137, 10, 42161, 324, 56, 43114], // Full support including testnet
    },
  ],
  // Legacy support
  PAYMENT_AMOUNT: 0.0000001, // ETH amount required for receipt generation
  
  // Network names for display
  NETWORK_NAMES: {
    1: 'Ethereum Mainnet',
    8453: 'Base Mainnet', 
    84532: 'Base Sepolia',
    137: 'Polygon Mainnet',
    10: 'Optimism Mainnet',
    42161: 'Arbitrum One',
    324: 'zkSync Era',
    56: 'BNB Smart Chain',
    43114: 'Avalanche C-Chain',
  } as Record<number, string>
}


console.log('Using networks:', networks)
// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

// Export wagmi adapter\nexport { wagmiAdapter }

// Helper functions for multi-network token contracts
export function getTokenContractAddress(tokenType: string, chainId: number): string | null {
  const paymentOption = APP_CONFIG.PAYMENT_OPTIONS.find(option => option.type === tokenType)
  if (!paymentOption) return null
  
  if (tokenType === 'ETH') return null // Native token
  
  const contractAddresses = (paymentOption as any).contractAddresses
  return contractAddresses?.[chainId] || null
}

// Get alternative token contract addresses (for tokens that might have multiple versions)
export function getAlternativeTokenAddresses(tokenType: string, chainId: number): string[] {
  // Polygon has multiple USDC versions
  if (tokenType === 'USDC' && chainId === 137) {
    return [
      '0x2791Bca1f2de4661ED88A30c99A7a9449Aa84174', // USDC (Bridged from Ethereum) 
      '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC.e (Native USDC)
    ]
  }
  
  // For other networks, return the primary address
  const primaryAddress = getTokenContractAddress(tokenType, chainId)
  return primaryAddress ? [primaryAddress] : []
}

export function getTokenDecimals(tokenType: string, chainId: number): number {
  const paymentOption = APP_CONFIG.PAYMENT_OPTIONS.find(option => option.type === tokenType)
  if (!paymentOption) return 18 // Default
  
  if (tokenType === 'ETH') return 18 // ETH has 18 decimals
  
  const decimals = (paymentOption as any).decimals
  return decimals?.[chainId] || 6 // Default for stablecoins
}

export function isTokenSupportedOnNetwork(tokenType: string, chainId: number): boolean {
  const paymentOption = APP_CONFIG.PAYMENT_OPTIONS.find(option => option.type === tokenType)
  if (!paymentOption) return false
  
  return paymentOption.supportedNetworks.includes(chainId)
}

// Helper function to format payment amounts consistently
export function formatPaymentAmount(amount: number): string {
  return amount.toFixed(7).replace(/\.?0+$/, '')
}

export function getAvailablePaymentOptions(chainId: number) {
  return APP_CONFIG.PAYMENT_OPTIONS.filter(option => 
    isTokenSupportedOnNetwork(option.type, chainId)
  ).map(option => ({
    ...option,
    contractAddress: getTokenContractAddress(option.type, chainId),
    decimals: getTokenDecimals(option.type, chainId),
    networkName: APP_CONFIG.NETWORK_NAMES[chainId] || `Network ${chainId}`
  }))
}