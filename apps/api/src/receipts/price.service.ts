import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

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
  
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get token price in USDT using CoinGecko API
   */
  async getTokenPriceInUSDT(token: string, amount: string): Promise<{ usdtValue: number; pricePerToken: number } | null> {
    try {
      const tokenId = this.getTokenId(token)
      if (!tokenId) {
        this.logger.warn(`Unknown token: ${token}`)
        return null
      }

      // Use CoinGecko free API
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd,usdt`
      
      this.logger.log(`Fetching price for ${token} (${tokenId})`)
      
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
      
      if (!data[tokenId]) {
        this.logger.warn(`Price data not found for ${tokenId}`)
        return null
      }

      // Prefer USDT price, fallback to USD
      const pricePerToken = data[tokenId].usdt || data[tokenId].usd
      const tokenAmount = parseFloat(amount)
      const usdtValue = tokenAmount * pricePerToken

      this.logger.log(`Price conversion: ${amount} ${token} = ${usdtValue.toFixed(6)} USDT (rate: ${pricePerToken})`)

      return {
        usdtValue,
        pricePerToken
      }
    } catch (error) {
      this.logger.error(`Error fetching price for ${token}:`, error.message)
      return null
    }
  }

  /**
   * Map token symbols to CoinGecko IDs
   */
  private getTokenId(token: string): string | null {
    const tokenMap: { [key: string]: string } = {
      'ETH': 'ethereum',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'BTC': 'bitcoin',
      'WETH': 'weth',
      'DAI': 'dai',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'SOL': 'solana',
      'DOT': 'polkadot',
      'ATOM': 'cosmos',
      'NEAR': 'near',
      'FTM': 'fantom',
      'ALGO': 'algorand',
      'XLM': 'stellar',
      'VET': 'vechain',
      'THETA': 'theta-token',
      'ICP': 'internet-computer',
      'SAND': 'the-sandbox',
      'MANA': 'decentraland',
      'CRV': 'curve-dao-token',
      'COMP': 'compound-governance-token',
      'SUSHI': 'sushi',
      'YFI': 'yearn-finance',
      'SNX': 'havven',
      'MKR': 'maker',
      'AAVE': 'aave',
      '1INCH': '1inch',
      'ENJ': 'enjincoin',
      'BAT': 'basic-attention-token',
      'ZRX': '0x',
      'OMG': 'omisego',
      'LRC': 'loopring',
      'GRT': 'the-graph',
      'STORJ': 'storj',
      'REN': 'republic-protocol',
      'KNC': 'kyber-network-crystal',
      'ZIL': 'zilliqa',
      'QTUM': 'qtum',
      'ICX': 'icon',
      'ONT': 'ontology',
      'ZEC': 'zcash',
      'DASH': 'dash',
      'XMR': 'monero',
      'ETC': 'ethereum-classic',
      'BSV': 'bitcoin-cash-sv',
      'BCH': 'bitcoin-cash',
      'LTC': 'litecoin',
      'XRP': 'ripple',
      'TRX': 'tron',
      'EOS': 'eos',
      'IOTA': 'iota',
      'NEO': 'neo',
      'XTZ': 'tezos',
      // Base network specific tokens
      'BALD': 'bald-base',
      'PRIME': 'echelon-prime',
      'DEGEN': 'degen-base',
    }

    return tokenMap[token.toUpperCase()] || null
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
  isTokenSupported(token: string): boolean {
    return this.getTokenId(token) !== null
  }
}