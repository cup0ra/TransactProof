/**
 * Test script for historical price functionality
 * This is a development utility to test the new historical pricing feature
 */

import { CoinGeckoService } from '../common/services/coingecko.service'
import { PriceService } from './price.service'
import { ConfigService } from '@nestjs/config'

async function testHistoricalPrice() {
  console.log('🧪 Testing Historical Price Functionality')
  console.log('=' .repeat(50))

  const configService = new ConfigService()
  const coinGeckoService = new CoinGeckoService()
  const priceService = new PriceService(configService, coinGeckoService)

  // Test cases
  const testCases = [
    {
      token: 'ETH',
      amount: '1.0',
      date: new Date('2024-01-01T00:00:00Z'),
      description: 'ETH price on New Year 2024'
    },
    {
      token: 'BTC',
      amount: '0.1',
      date: new Date('2024-06-15T00:00:00Z'),
      description: 'BTC price in mid-June 2024'
    },
    {
      token: 'USDT',
      amount: '1000',
      date: new Date('2024-03-01T00:00:00Z'),
      description: 'USDT price in March 2024'
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.description}`)
    console.log(`Token: ${testCase.token}, Amount: ${testCase.amount}`)
    console.log(`Date: ${testCase.date.toDateString()}`)

    try {
      // Test current price (old behavior)
      console.log('\n🕐 Current price:')
      const currentPrice = await priceService.getTokenPriceInUSDT(testCase.token, testCase.amount)
      if (currentPrice) {
        console.log(`${testCase.amount} ${testCase.token} = $${currentPrice.usdtValue.toFixed(2)} (rate: $${currentPrice.pricePerToken.toFixed(2)})`)
      } else {
        console.log('❌ Current price not available')
      }

      // Test historical price (new behavior)
      console.log('\n📅 Historical price:')
      const historicalPrice = await priceService.getHistoricalTokenPriceInUSDT(
        testCase.token, 
        testCase.amount, 
        testCase.date
      )
      if (historicalPrice) {
        console.log(`${testCase.amount} ${testCase.token} = $${historicalPrice.usdtValue.toFixed(2)} (rate: $${historicalPrice.pricePerToken.toFixed(2)} on ${testCase.date.toDateString()})`)
        
        if (historicalPrice.tokenInfo?.historicalDate) {
          console.log(`📊 Used historical data from: ${new Date(historicalPrice.tokenInfo.historicalDate).toDateString()}`)
        }
      } else {
        console.log('❌ Historical price not available')
      }

    } catch (error) {
      console.error(`❌ Error testing ${testCase.token}:`, error.message)
    }

    console.log('-'.repeat(30))
  }

  console.log('\n✅ Historical price testing completed!')
}

// Export for potential use in tests
export { testHistoricalPrice }

// Run if executed directly
if (require.main === module) {
  testHistoricalPrice().catch(console.error)
}