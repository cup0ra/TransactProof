import { Injectable, Logger } from '@nestjs/common'
import { 
  CoinGeckoSearchResponse, 
  CoinGeckoCoinsListItem, 
  TokenSearchResult 
} from '../interfaces/coingecko.interface'
import { getCoinGeckoId, isTokenSupported, getTokenConfig } from '../config/tokens.config'

@Injectable()
export class CoinGeckoService {
  private readonly logger = new Logger(CoinGeckoService.name)
  private readonly baseUrl = 'https://api.coingecko.com/api/v3'
  
  // Cache for token searches to avoid repeated API calls
  private tokenSearchCache = new Map<string, TokenSearchResult | null>()
  private coinsListCache: CoinGeckoCoinsListItem[] | null = null
  private coinsListCacheExpiry: number = 0
  
  // Cache duration: 24 hours for coins list, 1 hour for token searches
  private readonly COINS_LIST_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly TOKEN_SEARCH_CACHE_DURATION = 60 * 60 * 1000 // 1 hour

  /**
   * Find token ID with fallback strategies
   */
  async findTokenId(symbol: string): Promise<TokenSearchResult | null> {
    const normalizedSymbol = symbol.toUpperCase()
    
    // Check cache first
    if (this.tokenSearchCache.has(normalizedSymbol)) {
      const cached = this.tokenSearchCache.get(normalizedSymbol)
      this.logger.log(`Using cached result for ${symbol}: ${cached?.coinGeckoId || 'not found'}`)
      return cached
    }

    // Strategy 1: Check configuration first (highest confidence)
    const configId = getCoinGeckoId(symbol)
    if (configId) {
      const config = getTokenConfig(symbol)
      const result: TokenSearchResult = {
        coinGeckoId: configId,
        symbol: normalizedSymbol,
        name: config?.name || symbol,
        confidence: 'high',
        source: 'config'
      }
      this.cacheTokenResult(normalizedSymbol, result)
      return result
    }

    this.logger.log(`Token ${symbol} not found in config, trying API search...`)

    // Strategy 2: Use CoinGecko search API
    try {
      const searchResult = await this.searchTokenBySymbol(symbol)
      if (searchResult) {
        this.cacheTokenResult(normalizedSymbol, searchResult)
        return searchResult
      }
    } catch (error) {
      this.logger.warn(`Search API failed for ${symbol}: ${error.message}`)
    }

    // Strategy 3: Search in coins list (fallback)
    try {
      const coinsListResult = await this.searchInCoinsList(symbol)
      if (coinsListResult) {
        this.cacheTokenResult(normalizedSymbol, coinsListResult)
        return coinsListResult
      }
    } catch (error) {
      this.logger.warn(`Coins list search failed for ${symbol}: ${error.message}`)
    }

    // Cache negative result to avoid repeated API calls
    this.cacheTokenResult(normalizedSymbol, null)
    this.logger.warn(`Token ${symbol} not found in any source`)
    return null
  }

  /**
   * Search token using CoinGecko search API
   */
  private async searchTokenBySymbol(symbol: string): Promise<TokenSearchResult | null> {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(symbol)}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CoinGeckoSearchResponse = await response.json()
      
      if (!data.coins || data.coins.length === 0) {
        return null
      }

      // Find exact symbol match first
      const exactMatch = data.coins.find(
        coin => coin.symbol.toLowerCase() === symbol.toLowerCase()
      )

      if (exactMatch) {
        return {
          coinGeckoId: exactMatch.id,
          symbol: exactMatch.symbol.toUpperCase(),
          name: exactMatch.name,
          confidence: 'high',
          source: 'search'
        }
      }

      // If no exact match, take the first result with lower confidence
      const firstResult = data.coins[0]
      return {
        coinGeckoId: firstResult.id,
        symbol: firstResult.symbol.toUpperCase(),
        name: firstResult.name,
        confidence: 'medium',
        source: 'search'
      }
    } catch (error) {
      this.logger.error(`Error searching for token ${symbol}:`, error.message)
      throw error
    }
  }

  /**
   * Search in the full coins list (cached)
   */
  private async searchInCoinsList(symbol: string): Promise<TokenSearchResult | null> {
    const coinsList = await this.getCoinsList()
    
    if (!coinsList) {
      return null
    }

    // Find exact symbol match
    const exactMatch = coinsList.find(
      coin => coin.symbol.toLowerCase() === symbol.toLowerCase()
    )

    if (exactMatch) {
      return {
        coinGeckoId: exactMatch.id,
        symbol: exactMatch.symbol.toUpperCase(),
        name: exactMatch.name,
        confidence: 'medium',
        source: 'coins_list'
      }
    }

    return null
  }

  /**
   * Get cached coins list or fetch from API
   */
  private async getCoinsList(): Promise<CoinGeckoCoinsListItem[] | null> {
    const now = Date.now()
    
    // Return cached list if still valid
    if (this.coinsListCache && now < this.coinsListCacheExpiry) {
      return this.coinsListCache
    }

    try {
      const url = `${this.baseUrl}/coins/list`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const coinsList: CoinGeckoCoinsListItem[] = await response.json()
      
      // Cache the result
      this.coinsListCache = coinsList
      this.coinsListCacheExpiry = now + this.COINS_LIST_CACHE_DURATION
      
      this.logger.log(`Cached ${coinsList.length} coins from CoinGecko`)
      return coinsList
    } catch (error) {
      this.logger.error(`Error fetching coins list:`, error.message)
      // Return stale cache if available
      return this.coinsListCache
    }
  }

  /**
   * Cache token search result
   */
  private cacheTokenResult(symbol: string, result: TokenSearchResult | null) {
    this.tokenSearchCache.set(symbol, result)
    
    // Clean up old cache entries periodically
    if (this.tokenSearchCache.size > 1000) {
      this.cleanupTokenCache()
    }
  }

  /**
   * Clean up old token cache entries
   */
  private cleanupTokenCache() {
    // Keep only the first 500 entries (simple cleanup strategy)
    const entries = Array.from(this.tokenSearchCache.entries())
    this.tokenSearchCache.clear()
    
    entries.slice(0, 500).forEach(([key, value]) => {
      this.tokenSearchCache.set(key, value)
    })
    
    this.logger.log('Cleaned up token search cache')
  }

  /**
   * Check if token is supported (config + API search)
   */
  async isTokenSupported(symbol: string): Promise<boolean> {
    // First check config for quick response
    if (isTokenSupported(symbol)) {
      return true
    }

    // Then check API
    const result = await this.findTokenId(symbol)
    return result !== null
  }

  /**
   * Clear all caches (useful for testing or manual refresh)
   */
  clearCaches() {
    this.tokenSearchCache.clear()
    this.coinsListCache = null
    this.coinsListCacheExpiry = 0
    this.logger.log('All caches cleared')
  }
}