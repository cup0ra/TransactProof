export interface CoinGeckoSearchResult {
  id: string
  symbol: string
  name: string
  api_symbol?: string
  market_cap_rank?: number
  thumb?: string
  large?: string
}

export interface CoinGeckoSearchResponse {
  coins: CoinGeckoSearchResult[]
}

export interface CoinGeckoCoinsListItem {
  id: string
  symbol: string
  name: string
  platforms?: Record<string, string>
}

export interface TokenSearchResult {
  coinGeckoId: string
  symbol: string
  name: string
  confidence: 'high' | 'medium' | 'low'
  source: 'config' | 'search' | 'coins_list'
}