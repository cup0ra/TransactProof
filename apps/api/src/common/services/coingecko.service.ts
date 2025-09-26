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
  
  // Track token usage for auto-caching frequently used tokens
  private tokenUsageCount = new Map<string, number>()
  
  // Cache duration: 24 hours for coins list, 1 hour for token searches
  private readonly COINS_LIST_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly TOKEN_SEARCH_CACHE_DURATION = 60 * 60 * 1000 // 1 hour
  private readonly AUTO_CACHE_USAGE_THRESHOLD = 3 // Auto-cache tokens used 3+ times

  // Optional API key (demo or pro) for higher rate limits if provided
  private readonly apiKey: string | undefined = process.env.COINGECKO_API_KEY || process.env.COINGECKO_DEMO_API_KEY
  private readonly userAgent = 'TransactProof/1.0 (+https://github.com/cup0ra/transactproof)'

  // Historical price cache (key: `${coinGeckoId}:${DD-MM-YYYY}`)
  private historicalPriceCache = new Map<string, { value: { usd: number; usdt?: number } | null; expiry: number }>()
  private readonly HISTORICAL_PRICE_CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

  // Intraday (timestamp) price cache (key: `${coinGeckoId}:${bucketTimestampSec}`) where bucket is 5‑minute aligned
  private intradayPriceCache = new Map<string, { value: number | null; expiry: number }>()
  private readonly INTRADAY_PRICE_CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private readonly INTRADAY_BUCKET_SECONDS = 300 // 5 minutes
  private readonly INTRADAY_WINDOW_SECONDS = 1800 // ±30 min window for range query

  // Retry configuration for transient CoinGecko errors
  private readonly MAX_RETRIES = 3
  private readonly RETRY_BASE_DELAY_MS = 500

  /**
   * Find token ID with fallback strategies
   */
  async findTokenId(symbol: string): Promise<TokenSearchResult | null> {
    const normalizedSymbol = symbol.toUpperCase()
    
    // Track usage for auto-caching
    this.trackTokenUsage(normalizedSymbol)
    
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
        this.autoAddToRuntimeConfig(searchResult) // Auto-add if frequently used
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
        this.autoAddToRuntimeConfig(coinsListResult) // Auto-add if frequently used
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
   * Get historical price for a token on a specific date
   */
  async getHistoricalPrice(coinGeckoId: string, date: Date): Promise<{ usd: number; usdt?: number } | null> {
    try {
      // Defensive: future dates are not valid for CoinGecko history endpoint -> clamp to today
      const now = new Date()
      let effectiveDate = date
      if (date.getTime() > now.getTime()) {
        this.logger.warn(`Requested historical price for future date ${date.toISOString()} — clamping to current date.`)
        effectiveDate = now
      }

      // Format date as DD-MM-YYYY (CoinGecko format)
      const formattedDate = this.formatDateForCoinGecko(effectiveDate)
      const cacheKey = `${coinGeckoId}:${formattedDate}`

      // Return cached historical price if fresh
      const cached = this.historicalPriceCache.get(cacheKey)
      if (cached && cached.expiry > Date.now()) {
        this.logger.log(`Using cached historical price for ${coinGeckoId} on ${formattedDate}`)
        return cached.value
      }

      const url = `${this.baseUrl}/coins/${coinGeckoId}/history?date=${formattedDate}&localization=false`
      this.logger.log(`Fetching historical price for ${coinGeckoId} on ${formattedDate}`)

      const data = await this.fetchWithRetry(url)

      if (!data || !data.market_data || !data.market_data.current_price) {
        this.logger.warn(`No historical price data found for ${coinGeckoId} on ${formattedDate}`)
        this.historicalPriceCache.set(cacheKey, { value: null, expiry: Date.now() + this.HISTORICAL_PRICE_CACHE_TTL })
        return null
      }

      const priceData = data.market_data.current_price
      const result = {
        usd: priceData.usd || 0,
        usdt: priceData.usdt || priceData.usd || 0
      }

      this.historicalPriceCache.set(cacheKey, { value: result, expiry: Date.now() + this.HISTORICAL_PRICE_CACHE_TTL })
      return result
    } catch (error) {
      this.logger.error(`Error fetching historical price for ${coinGeckoId} on ${date}:`, error.message)
      return null
    }
  }

  /**
   * Format date for CoinGecko API (DD-MM-YYYY)
   */
  private formatDateForCoinGecko(date: Date): string {
    const day = date.getUTCDate().toString().padStart(2, '0')
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const year = date.getUTCFullYear()
    return `${day}-${month}-${year}`
  }

  /**
   * Clear all caches (useful for testing or manual refresh)
   */
  clearCaches() {
    this.tokenSearchCache.clear()
    this.coinsListCache = null
    this.coinsListCacheExpiry = 0
    this.tokenUsageCount.clear()
    this.historicalPriceCache.clear()
    this.intradayPriceCache.clear()
    this.logger.log('All caches cleared')
  }

  /**
   * Track token usage for auto-caching frequently used tokens
   */
  private trackTokenUsage(symbol: string): void {
    const currentCount = this.tokenUsageCount.get(symbol) || 0
    this.tokenUsageCount.set(symbol, currentCount + 1)
    
    const newCount = currentCount + 1
    if (newCount === this.AUTO_CACHE_USAGE_THRESHOLD) {
      this.logger.log(`Token ${symbol} reached usage threshold (${newCount}x) - candidate for auto-caching`)
    }
  }

  /**
   * Auto-add frequently used tokens to runtime configuration
   */
  private autoAddToRuntimeConfig(tokenResult: TokenSearchResult): void {
    const usageCount = this.tokenUsageCount.get(tokenResult.symbol) || 0
    
    // Only auto-add if token is used frequently and not already in config
    if (usageCount >= this.AUTO_CACHE_USAGE_THRESHOLD && !getCoinGeckoId(tokenResult.symbol)) {
      this.logger.log(`🚀 RECOMMENDATION: Token ${tokenResult.symbol} used ${usageCount}x - consider adding to TOKENS_CONFIG for better performance`)
      this.logger.log(`   Add: { symbol: '${tokenResult.symbol}', coinGeckoId: '${tokenResult.coinGeckoId}', name: '${tokenResult.name}', category: 'altcoin' }`)
    }
  }

  /**
   * Get usage statistics for tokens (useful for optimization)
   */
  getTokenUsageStats(): { symbol: string; usageCount: number; inConfig: boolean }[] {
    return Array.from(this.tokenUsageCount.entries())
      .map(([symbol, count]) => ({
        symbol,
        usageCount: count,
        inConfig: !!getCoinGeckoId(symbol)
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
  }

  /**
   * Generic fetch with retry/backoff for transient CoinGecko errors
   */
  private async fetchWithRetry(url: string, attempt: number = 1): Promise<any> {
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (this.apiKey) {
      headers['x-cg-demo-api-key'] = this.apiKey // CoinGecko accepts demo/pro header keys similarly
    }
    headers['User-Agent'] = this.userAgent

    try {
      const response = await fetch(url, { method: 'GET', headers })
      if (!response.ok) {
        // For 429 or 5xx, attempt retry with backoff
        if ((response.status === 429 || response.status >= 500) && attempt < this.MAX_RETRIES) {
          const retryAfterHeader = response.headers.get('Retry-After')
          const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : this.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
          this.logger.warn(`CoinGecko request failed with status ${response.status}. Retrying in ${retryAfterMs}ms (attempt ${attempt}/${this.MAX_RETRIES})`)
          await new Promise(res => setTimeout(res, retryAfterMs))
          return this.fetchWithRetry(url, attempt + 1)
        }

        let bodyText: string | undefined
        try { bodyText = await response.text() } catch { /* ignore */ }
        throw new Error(`HTTP ${response.status} ${response.statusText} body=${bodyText?.slice(0,300)}`)
      }
      return await response.json()
    } catch (err) {
      if (attempt < this.MAX_RETRIES) {
        const delay = this.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
        this.logger.warn(`Fetch error on attempt ${attempt} for ${url}: ${err.message}. Retrying in ${delay}ms`)
        await new Promise(res => setTimeout(res, delay))
        return this.fetchWithRetry(url, attempt + 1)
      }
      this.logger.error(`Failed to fetch ${url} after ${attempt} attempts: ${err.message}`)
      throw err
    }
  }

  /**
   * Get approximate price at a specific timestamp using market_chart/range endpoint.
   * Returns a single numeric price in USD (or USDT equivalent) or null if unavailable.
   * Strategy:
   *  - Align timestamp to 5‑min bucket for cache key
   *  - Query ±INTRADAY_WINDOW_SECONDS (default 30 min each side)
   *  - Find nearest point; if two equidistant points exist, average them
   */
  async getHistoricalPriceAtTimestamp(coinGeckoId: string, timestamp: Date): Promise<number | null> {
    try {
      const tsSec = Math.floor(timestamp.getTime() / 1000)
      const bucket = tsSec - (tsSec % this.INTRADAY_BUCKET_SECONDS)
      const cacheKey = `${coinGeckoId}:${bucket}`
      const cached = this.intradayPriceCache.get(cacheKey)
      if (cached && cached.expiry > Date.now()) {
        this.logger.log(`Using cached intraday price for ${coinGeckoId} @ bucket ${bucket}`)
        return cached.value
      }

      const from = tsSec - this.INTRADAY_WINDOW_SECONDS
      const to = tsSec + this.INTRADAY_WINDOW_SECONDS
      const url = `${this.baseUrl}/coins/${coinGeckoId}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
      this.logger.log(`Fetching intraday price range for ${coinGeckoId} ts=${tsSec} (from=${from}, to=${to})`)
      const data = await this.fetchWithRetry(url)

      if (!data || !Array.isArray(data.prices) || data.prices.length === 0) {
        this.logger.warn(`No intraday price data returned for ${coinGeckoId} around ts=${tsSec}`)
        this.intradayPriceCache.set(cacheKey, { value: null, expiry: Date.now() + this.INTRADAY_PRICE_CACHE_TTL })
        return null
      }

      // CoinGecko returns [ [ms, price], ... ]
      const targetMs = tsSec * 1000
      let nearest: { dist: number; price: number; ts: number } | null = null
      let secondNearest: { dist: number; price: number; ts: number } | null = null

      for (const point of data.prices) {
        if (!Array.isArray(point) || point.length < 2) continue
        const [ptTs, ptPrice] = point
        if (typeof ptTs !== 'number' || typeof ptPrice !== 'number') continue
        const dist = Math.abs(ptTs - targetMs)
        if (!nearest || dist < nearest.dist) {
          secondNearest = nearest
          nearest = { dist, price: ptPrice, ts: ptTs }
        } else if (!secondNearest || dist < secondNearest.dist) {
          secondNearest = { dist, price: ptPrice, ts: ptTs }
        }
      }

      if (!nearest) {
        this.logger.warn(`Could not determine nearest price point for ${coinGeckoId} ts=${tsSec}`)
        this.intradayPriceCache.set(cacheKey, { value: null, expiry: Date.now() + this.INTRADAY_PRICE_CACHE_TTL })
        return null
      }

      let finalPrice = nearest.price
      // If second nearest exists and is equidistant (within 60s), average for smoother result
      if (secondNearest && Math.abs(nearest.dist - secondNearest.dist) <= 60 * 1000) {
        finalPrice = (nearest.price + secondNearest.price) / 2
      }

      this.intradayPriceCache.set(cacheKey, { value: finalPrice, expiry: Date.now() + this.INTRADAY_PRICE_CACHE_TTL })
      return finalPrice
    } catch (error) {
      this.logger.warn(`Intraday price fetch failed for ${coinGeckoId} @ ${timestamp.toISOString()}: ${error.message}`)
      return null
    }
  }
}