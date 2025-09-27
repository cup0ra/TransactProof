/**
 * Token mapping configuration for CoinGecko API
 * 
 * This configuration serves as a FAST CACHE for the most popular tokens only.
 * The system has multiple fallback strategies for token discovery:
 * 
 * 1. TOKENS_CONFIG (this file) - instant lookup for popular tokens
 * 2. CoinGecko Search API - for unknown tokens 
 * 3. CoinGecko Coins List API - comprehensive fallback
 * 4. Dynamic contract reading - gets token info directly from blockchain
 * 
 * Architecture Benefits:
 * - Instant lookup for popular tokens (ETH, BTC, USDT, etc.)
 * - Automatic discovery of new/unknown tokens
 * - No maintenance required for obscure tokens
 * - Dynamic contract symbol/decimals reading
 * 
 * Adding new tokens:
 * - Popular tokens: Add to TOKENS_CONFIG for fastest lookup
 * - Other tokens: Automatically discovered via API - no config needed
 */

export interface TokenConfig {
  symbol: string
  coinGeckoId: string
  name?: string
  category?: 'major' | 'altcoin' | 'defi' | 'layer1' | 'layer2' | 'meme' | 'base'
}

export const TOKENS_CONFIG: TokenConfig[] = [
  // Major cryptocurrencies - optimized cache for fastest lookup
  { symbol: 'ETH', coinGeckoId: 'ethereum', name: 'Ethereum', category: 'major' },
  { symbol: 'BTC', coinGeckoId: 'bitcoin', name: 'Bitcoin', category: 'major' },
  { symbol: 'USDT', coinGeckoId: 'tether', name: 'Tether', category: 'major' },
  { symbol: 'USDC', coinGeckoId: 'usd-coin', name: 'USD Coin', category: 'major' },
  { symbol: 'BNB', coinGeckoId: 'binancecoin', name: 'BNB', category: 'major' },

  // Layer 1 protocols - most popular
  { symbol: 'SOL', coinGeckoId: 'solana', name: 'Solana', category: 'layer1' },
  { symbol: 'ADA', coinGeckoId: 'cardano', name: 'Cardano', category: 'layer1' },
  { symbol: 'AVAX', coinGeckoId: 'avalanche-2', name: 'Avalanche', category: 'layer1' },
  { symbol: 'DOT', coinGeckoId: 'polkadot', name: 'Polkadot', category: 'layer1' },
  { symbol: 'MATIC', coinGeckoId: 'matic-network', name: 'Polygon', category: 'layer2' },

  // DeFi tokens - most common
  { symbol: 'WETH', coinGeckoId: 'weth', name: 'Wrapped Ether', category: 'defi' },
  { symbol: 'DAI', coinGeckoId: 'dai', name: 'Dai Stablecoin', category: 'defi' },
  { symbol: 'LINK', coinGeckoId: 'chainlink', name: 'Chainlink', category: 'defi' },
  { symbol: 'UNI', coinGeckoId: 'uniswap', name: 'Uniswap', category: 'defi' },
  { symbol: 'AAVE', coinGeckoId: 'aave', name: 'Aave', category: 'defi' },

  // Popular altcoins
  { symbol: 'LTC', coinGeckoId: 'litecoin', name: 'Litecoin', category: 'altcoin' },
  { symbol: 'XRP', coinGeckoId: 'ripple', name: 'XRP', category: 'altcoin' },
  { symbol: 'BCH', coinGeckoId: 'bitcoin-cash', name: 'Bitcoin Cash', category: 'altcoin' },

  // Base network specific tokens (since you use Base)
  { symbol: 'DEGEN', coinGeckoId: 'degen-base', name: 'Degen', category: 'base' },

  // NOTE: Other tokens are found dynamically via CoinGecko API
  // This config now serves as a fast cache for the most common tokens only
  // All other tokens are looked up via:
  // 1. CoinGecko Search API
  // 2. CoinGecko Coins List API
  // 3. Dynamic caching in memory
]

/**
 * Create a mapping from token symbol to CoinGecko ID
 */
export const TOKEN_SYMBOL_TO_COINGECKO_ID: Record<string, string> = 
  TOKENS_CONFIG.reduce((acc, token) => {
    acc[token.symbol.toUpperCase()] = token.coinGeckoId
    return acc
  }, {} as Record<string, string>)

/**
 * Get token config by symbol
 */
export function getTokenConfig(symbol: string): TokenConfig | undefined {
  return TOKENS_CONFIG.find(token => token.symbol.toUpperCase() === symbol.toUpperCase())
}

/**
 * Get CoinGecko ID by token symbol
 */
export function getCoinGeckoId(symbol: string): string | null {
  return TOKEN_SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()] || null
}

/**
 * Check if a token is supported
 */
export function isTokenSupported(symbol: string): boolean {
  return getCoinGeckoId(symbol) !== null
}

/**
 * Get tokens by category
 */
export function getTokensByCategory(category: TokenConfig['category']): TokenConfig[] {
  return TOKENS_CONFIG.filter(token => token.category === category)
}