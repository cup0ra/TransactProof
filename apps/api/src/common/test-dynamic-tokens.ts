/**
 * Test script for the new dynamic token discovery system
 * 
 * This script demonstrates how the optimized token system works:
 * 1. Fast lookup for popular tokens (from TOKENS_CONFIG)
 * 2. Dynamic discovery for unknown tokens (via CoinGecko API)
 * 3. Usage tracking and optimization recommendations
 */

import { CoinGeckoService } from '../common/services/coingecko.service'

async function testDynamicTokenSystem() {
  console.log('🧪 Testing Dynamic Token Discovery System')
  console.log('=' .repeat(60))

  const coinGeckoService = new CoinGeckoService()

  // Test cases to demonstrate the system
  const testTokens = [
    { symbol: 'ETH', description: 'Popular token (should be instant from config)', expectedSource: 'config' },
    { symbol: 'BTC', description: 'Popular token (should be instant from config)', expectedSource: 'config' },
    { symbol: 'DOGE', description: 'Known token (should be found via API)', expectedSource: 'search' },
    { symbol: 'PEPE', description: 'Meme token (should be found via API)', expectedSource: 'search' },
    { symbol: 'SHIB', description: 'Popular meme token (should be found)', expectedSource: 'search' },
    { symbol: 'UNKNOWN_TOKEN_123', description: 'Non-existent token (should fail gracefully)', expectedSource: null }
  ]

  for (const test of testTokens) {
    console.log(`\n📋 Testing: ${test.symbol}`)
    console.log(`   Expected: ${test.description}`)
    
    try {
      const startTime = Date.now()
      const result = await coinGeckoService.findTokenId(test.symbol)
      const endTime = Date.now()
      const duration = endTime - startTime

      if (result) {
        console.log(`   ✅ Found: ${result.coinGeckoId}`)
        console.log(`   📊 Source: ${result.source} (confidence: ${result.confidence})`)
        console.log(`   ⚡ Speed: ${duration}ms`)
        
        if (result.source === test.expectedSource) {
          console.log(`   🎯 Source matches expectation: ${test.expectedSource}`)
        } else {
          console.log(`   ⚠️  Source differs from expected: ${test.expectedSource} vs ${result.source}`)
        }
      } else {
        console.log(`   ❌ Not found (${duration}ms)`)
        if (test.expectedSource === null) {
          console.log(`   🎯 Expected result: token should not exist`)
        }
      }
    } catch (error) {
      console.error(`   💥 Error: ${error.message}`)
    }
  }

  // Test usage tracking
  console.log(`\n\n📊 Usage Statistics After Testing:`)
  const usageStats = coinGeckoService.getTokenUsageStats()
  
  console.table(usageStats.map(stat => ({
    Token: stat.symbol,
    'Usage Count': stat.usageCount,
    'In Config': stat.inConfig ? '✅' : '❌',
    'Status': stat.usageCount >= 3 && !stat.inConfig ? '🚀 Add to config!' : 'OK'
  })))

  // Test repeated lookups for caching
  console.log(`\n\n🔄 Testing Cache Performance:`)
  console.log(`Looking up ETH 5 times to test caching...`)
  
  const ethTests = []
  for (let i = 0; i < 5; i++) {
    const startTime = Date.now()
    await coinGeckoService.findTokenId('ETH')
    const endTime = Date.now()
    ethTests.push(endTime - startTime)
  }
  
  console.log(`ETH lookup times: ${ethTests.join('ms, ')}ms`)
  console.log(`Average: ${Math.round(ethTests.reduce((a, b) => a + b, 0) / ethTests.length)}ms`)
  console.log(`First lookup: ${ethTests[0]}ms (config lookup)`)
  console.log(`Cached lookups: ${ethTests.slice(1).join('ms, ')}ms (should be <1ms)`)

  console.log(`\n\n✅ Dynamic Token Discovery System Test Complete!`)
  console.log(`\n📈 Key Insights:`)
  console.log(`   • Popular tokens (ETH, BTC): Instant lookup from config`)
  console.log(`   • Unknown tokens: Auto-discovered via CoinGecko API`)
  console.log(`   • System tracks usage and provides optimization recommendations`)
  console.log(`   • No more manual token maintenance required!`)
}

// Export for potential use in tests
export { testDynamicTokenSystem }

// Run if executed directly
if (require.main === module) {
  testDynamicTokenSystem().catch(console.error)
}