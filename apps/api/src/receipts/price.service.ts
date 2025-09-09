import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CoinGeckoService } from '../common/services/coingecko.service'

interface TokenPrice {
  usd: number
  usdt?: number
}

interface PriceResponse {
  [key: string]: TokenPrice
}

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name)
  
  constructor(
    private readonly configService: ConfigService,
    private readonly coinGeckoService: CoinGeckoService
  ) {}

  /**
   * Get token price in USDT using CoinGecko API
   */
  async getTokenPriceInUSDT(token: string, amount: string): Promise<{ usdtValue: number; pricePerToken: number; tokenInfo?: any } | null> {
    try {
      const tokenSearchResult = await this.coinGeckoService.findTokenId(token)
      if (!tokenSearchResult) {
        this.logger.warn(`Unknown token: ${token}`)
        return null
      }

      const { coinGeckoId, confidence, source } = tokenSearchResult
      this.logger.log(`Found token ${token} -> ${coinGeckoId} (confidence: ${confidence}, source: ${source})`)

      // Use CoinGecko free API
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd,usdt`
      
      this.logger.log(`Fetching price for ${token} (${coinGeckoId})`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: PriceResponse = await response.json()
      
      if (!data[coinGeckoId]) {
        this.logger.warn(`Price data not found for ${coinGeckoId}`)
        return null
      }

      // Prefer USDT price, fallback to USD
      const pricePerToken = data[coinGeckoId].usdt || data[coinGeckoId].usd
      const tokenAmount = parseFloat(amount)
      const usdtValue = tokenAmount * pricePerToken

      this.logger.log(`Price conversion: ${amount} ${token} = ${usdtValue.toFixed(6)} USDT (rate: ${pricePerToken})`)

      return {
        usdtValue,
        pricePerToken,
        tokenInfo: {
          coinGeckoId,
          confidence,
          source,
          name: tokenSearchResult.name
        }
      }
    } catch (error) {
      this.logger.error(`Error fetching price for ${token}:`, error.message)
      return null
    }
  }

  /**
   * Get token information and CoinGecko ID
   * @deprecated This method is replaced by CoinGeckoService.findTokenId()
   */
  private async getTokenId(token: string): Promise<string | null> {
    const result = await this.coinGeckoService.findTokenId(token)
    return result?.coinGeckoId || null
  }

  /**
   * Get multiple token prices at once
   */
  async getMultipleTokenPrices(tokens: string[]): Promise<{ [token: string]: number }> {
    const prices: { [token: string]: number } = {}
    
    for (const token of tokens) {
      const priceData = await this.getTokenPriceInUSDT(token, '1')
      if (priceData) {
        prices[token] = priceData.pricePerToken
      }
    }

    return prices
  }

  /**
   * Check if a token is supported
   */
  async isTokenSupported(token: string): Promise<boolean> {
    return await this.coinGeckoService.isTokenSupported(token)
  }
}