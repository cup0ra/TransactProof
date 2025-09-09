/**
 * Token mapping configuration for CoinGecko API
 * Maps token symbols to their corresponding CoinGecko IDs
 */

export interface TokenConfig {
  symbol: string
  coinGeckoId: string
  name?: string
  category?: 'major' | 'altcoin' | 'defi' | 'layer1' | 'layer2' | 'meme' | 'base'
}

export const TOKENS_CONFIG: TokenConfig[] = [
  // Major cryptocurrencies
  { symbol: 'ETH', coinGeckoId: 'ethereum', name: 'Ethereum', category: 'major' },
  { symbol: 'BTC', coinGeckoId: 'bitcoin', name: 'Bitcoin', category: 'major' },
  { symbol: 'USDT', coinGeckoId: 'tether', name: 'Tether', category: 'major' },
  { symbol: 'USDC', coinGeckoId: 'usd-coin', name: 'USD Coin', category: 'major' },
  { symbol: 'BNB', coinGeckoId: 'binancecoin', name: 'BNB', category: 'major' },

  // Layer 1 protocols
  { symbol: 'SOL', coinGeckoId: 'solana', name: 'Solana', category: 'layer1' },
  { symbol: 'ADA', coinGeckoId: 'cardano', name: 'Cardano', category: 'layer1' },
  { symbol: 'AVAX', coinGeckoId: 'avalanche-2', name: 'Avalanche', category: 'layer1' },
  { symbol: 'DOT', coinGeckoId: 'polkadot', name: 'Polkadot', category: 'layer1' },
  { symbol: 'ATOM', coinGeckoId: 'cosmos', name: 'Cosmos', category: 'layer1' },
  { symbol: 'NEAR', coinGeckoId: 'near', name: 'NEAR Protocol', category: 'layer1' },
  { symbol: 'FTM', coinGeckoId: 'fantom', name: 'Fantom', category: 'layer1' },
  { symbol: 'ALGO', coinGeckoId: 'algorand', name: 'Algorand', category: 'layer1' },
  { symbol: 'XTZ', coinGeckoId: 'tezos', name: 'Tezos', category: 'layer1' },

  // Layer 2 and sidechains
  { symbol: 'MATIC', coinGeckoId: 'matic-network', name: 'Polygon', category: 'layer2' },

  // DeFi tokens
  { symbol: 'WETH', coinGeckoId: 'weth', name: 'Wrapped Ether', category: 'defi' },
  { symbol: 'DAI', coinGeckoId: 'dai', name: 'Dai Stablecoin', category: 'defi' },
  { symbol: 'LINK', coinGeckoId: 'chainlink', name: 'Chainlink', category: 'defi' },
  { symbol: 'UNI', coinGeckoId: 'uniswap', name: 'Uniswap', category: 'defi' },
  { symbol: 'AAVE', coinGeckoId: 'aave', name: 'Aave', category: 'defi' },
  { symbol: 'CRV', coinGeckoId: 'curve-dao-token', name: 'Curve DAO Token', category: 'defi' },
  { symbol: 'COMP', coinGeckoId: 'compound-governance-token', name: 'Compound', category: 'defi' },
  { symbol: 'SUSHI', coinGeckoId: 'sushi', name: 'SushiSwap', category: 'defi' },
  { symbol: 'YFI', coinGeckoId: 'yearn-finance', name: 'Yearn Finance', category: 'defi' },
  { symbol: 'SNX', coinGeckoId: 'havven', name: 'Synthetix', category: 'defi' },
  { symbol: 'MKR', coinGeckoId: 'maker', name: 'Maker', category: 'defi' },
  { symbol: '1INCH', coinGeckoId: '1inch', name: '1inch', category: 'defi' },
  { symbol: 'LRC', coinGeckoId: 'loopring', name: 'Loopring', category: 'defi' },
  { symbol: 'GRT', coinGeckoId: 'the-graph', name: 'The Graph', category: 'defi' },

  // Altcoins
  { symbol: 'XLM', coinGeckoId: 'stellar', name: 'Stellar', category: 'altcoin' },
  { symbol: 'VET', coinGeckoId: 'vechain', name: 'VeChain', category: 'altcoin' },
  { symbol: 'THETA', coinGeckoId: 'theta-token', name: 'Theta Network', category: 'altcoin' },
  { symbol: 'ICP', coinGeckoId: 'internet-computer', name: 'Internet Computer', category: 'altcoin' },
  { symbol: 'ENJ', coinGeckoId: 'enjincoin', name: 'Enjin Coin', category: 'altcoin' },
  { symbol: 'BAT', coinGeckoId: 'basic-attention-token', name: 'Basic Attention Token', category: 'altcoin' },
  { symbol: 'ZRX', coinGeckoId: '0x', name: '0x Protocol', category: 'altcoin' },
  { symbol: 'OMG', coinGeckoId: 'omisego', name: 'OMG Network', category: 'altcoin' },
  { symbol: 'STORJ', coinGeckoId: 'storj', name: 'Storj', category: 'altcoin' },
  { symbol: 'REN', coinGeckoId: 'republic-protocol', name: 'Ren', category: 'altcoin' },
  { symbol: 'KNC', coinGeckoId: 'kyber-network-crystal', name: 'Kyber Network Crystal', category: 'altcoin' },
  { symbol: 'ZIL', coinGeckoId: 'zilliqa', name: 'Zilliqa', category: 'altcoin' },
  { symbol: 'QTUM', coinGeckoId: 'qtum', name: 'Qtum', category: 'altcoin' },
  { symbol: 'ICX', coinGeckoId: 'icon', name: 'ICON', category: 'altcoin' },
  { symbol: 'ONT', coinGeckoId: 'ontology', name: 'Ontology', category: 'altcoin' },
  { symbol: 'ZEC', coinGeckoId: 'zcash', name: 'Zcash', category: 'altcoin' },
  { symbol: 'DASH', coinGeckoId: 'dash', name: 'Dash', category: 'altcoin' },
  { symbol: 'XMR', coinGeckoId: 'monero', name: 'Monero', category: 'altcoin' },
  { symbol: 'ETC', coinGeckoId: 'ethereum-classic', name: 'Ethereum Classic', category: 'altcoin' },
  { symbol: 'BSV', coinGeckoId: 'bitcoin-cash-sv', name: 'Bitcoin SV', category: 'altcoin' },
  { symbol: 'BCH', coinGeckoId: 'bitcoin-cash', name: 'Bitcoin Cash', category: 'altcoin' },
  { symbol: 'LTC', coinGeckoId: 'litecoin', name: 'Litecoin', category: 'altcoin' },
  { symbol: 'XRP', coinGeckoId: 'ripple', name: 'XRP', category: 'altcoin' },
  { symbol: 'TRX', coinGeckoId: 'tron', name: 'TRON', category: 'altcoin' },
  { symbol: 'EOS', coinGeckoId: 'eos', name: 'EOS', category: 'altcoin' },
  { symbol: 'IOTA', coinGeckoId: 'iota', name: 'IOTA', category: 'altcoin' },
  { symbol: 'NEO', coinGeckoId: 'neo', name: 'Neo', category: 'altcoin' },

  // Gaming & Metaverse
  { symbol: 'SAND', coinGeckoId: 'the-sandbox', name: 'The Sandbox', category: 'altcoin' },
  { symbol: 'MANA', coinGeckoId: 'decentraland', name: 'Decentraland', category: 'altcoin' },

  // Base network specific tokens
  { symbol: 'BALD', coinGeckoId: 'bald-base', name: 'Bald', category: 'base' },
  { symbol: 'PRIME', coinGeckoId: 'echelon-prime', name: 'Echelon Prime', category: 'base' },
  { symbol: 'DEGEN', coinGeckoId: 'degen-base', name: 'Degen', category: 'base' },
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