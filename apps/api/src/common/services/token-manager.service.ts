import { Injectable, Logger } from '@nestjs/common'
import { TokenConfig, TOKENS_CONFIG } from '../config/tokens.config'
import { CoinGeckoService } from '../services/coingecko.service'

@Injectable()
export class TokenManagerService {
  private readonly logger = new Logger(TokenManagerService.name)

  constructor(private readonly coinGeckoService: CoinGeckoService) {}

  /**
   * Add a new token to the runtime configuration
   * Note: This only adds to runtime, not to the config file
   */
  addToken(tokenConfig: TokenConfig): boolean {
    try {
      // Check if token already exists
      const existingToken = TOKENS_CONFIG.find(
        t => t.symbol.toUpperCase() === tokenConfig.symbol.toUpperCase()
      )

      if (existingToken) {
        this.logger.warn(`Token ${tokenConfig.symbol} already exists`)
        return false
      }

      // Add to runtime config
      TOKENS_CONFIG.push({
        ...tokenConfig,
        symbol: tokenConfig.symbol.toUpperCase()
      })

      // Clear caches to ensure new token is recognized
      this.coinGeckoService.clearCaches()

      this.logger.log(`Added token ${tokenConfig.symbol} -> ${tokenConfig.coinGeckoId}`)
      return true
    } catch (error) {
      this.logger.error(`Error adding token ${tokenConfig.symbol}:`, error.message)
      return false
    }
  }

  /**
   * Remove a token from runtime configuration
   */
  removeToken(symbol: string): boolean {
    try {
      const index = TOKENS_CONFIG.findIndex(
        t => t.symbol.toUpperCase() === symbol.toUpperCase()
      )

      if (index === -1) {
        this.logger.warn(`Token ${symbol} not found in configuration`)
        return false
      }

      TOKENS_CONFIG.splice(index, 1)
      this.coinGeckoService.clearCaches()

      this.logger.log(`Removed token ${symbol}`)
      return true
    } catch (error) {
      this.logger.error(`Error removing token ${symbol}:`, error.message)
      return false
    }
  }

  /**
   * Update an existing token configuration
   */
  updateToken(symbol: string, updates: Partial<TokenConfig>): boolean {
    try {
      const tokenIndex = TOKENS_CONFIG.findIndex(
        t => t.symbol.toUpperCase() === symbol.toUpperCase()
      )

      if (tokenIndex === -1) {
        this.logger.warn(`Token ${symbol} not found in configuration`)
        return false
      }

      // Update token config
      TOKENS_CONFIG[tokenIndex] = {
        ...TOKENS_CONFIG[tokenIndex],
        ...updates,
        symbol: TOKENS_CONFIG[tokenIndex].symbol // Keep original symbol
      }

      this.coinGeckoService.clearCaches()

      this.logger.log(`Updated token ${symbol}`)
      return true
    } catch (error) {
      this.logger.error(`Error updating token ${symbol}:`, error.message)
      return false
    }
  }

  /**
   * Get all configured tokens
   */
  getAllTokens(): TokenConfig[] {
    return [...TOKENS_CONFIG] // Return copy to prevent mutations
  }

  /**
   * Get tokens by category
   */
  getTokensByCategory(category: TokenConfig['category']): TokenConfig[] {
    return TOKENS_CONFIG.filter(token => token.category === category)
  }

  /**
   * Search for a token and automatically add it if found via API
   */
  async searchAndAddToken(symbol: string, category: TokenConfig['category'] = 'altcoin'): Promise<boolean> {
    try {
      // First check if already configured
      const existing = TOKENS_CONFIG.find(
        t => t.symbol.toUpperCase() === symbol.toUpperCase()
      )

      if (existing) {
        this.logger.log(`Token ${symbol} already exists in configuration`)
        return true
      }

      // Search via CoinGecko API
      const searchResult = await this.coinGeckoService.findTokenId(symbol)
      if (!searchResult) {
        this.logger.warn(`Could not find token ${symbol} via API search`)
        return false
      }

      // Add to configuration
      const tokenConfig: TokenConfig = {
        symbol: symbol.toUpperCase(),
        coinGeckoId: searchResult.coinGeckoId,
        name: searchResult.name,
        category
      }

      return this.addToken(tokenConfig)
    } catch (error) {
      this.logger.error(`Error searching and adding token ${symbol}:`, error.message)
      return false
    }
  }

  /**
   * Validate all tokens in configuration against CoinGecko API
   */
  async validateAllTokens(): Promise<{ valid: TokenConfig[], invalid: TokenConfig[] }> {
    const valid: TokenConfig[] = []
    const invalid: TokenConfig[] = []

    for (const token of TOKENS_CONFIG) {
      try {
        // Try to fetch price to validate token ID
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${token.coinGeckoId}&vs_currencies=usd`
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          if (data[token.coinGeckoId]) {
            valid.push(token)
          } else {
            invalid.push(token)
          }
        } else {
          invalid.push(token)
        }
      } catch (error) {
        invalid.push(token)
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.logger.log(`Token validation complete: ${valid.length} valid, ${invalid.length} invalid`)
    return { valid, invalid }
  }
}