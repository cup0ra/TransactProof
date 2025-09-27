/**
 * Example: How the historical pricing works in practice
 * 
 * This demonstrates the difference between current and historical pricing
 */

// BEFORE (Current pricing - what we had before):
// ================================================

/* 
async function generateReceiptOLD(txHash: string) {
  const txDetails = await blockchainService.getTransactionDetails(txHash)
  
  // This would use CURRENT market price regardless of transaction date
  // If ETH is $2400 today, but transaction was 6 months ago when ETH was $1600,
  // the PDF would incorrectly show $2400 rate
  
  return {
    amount: "1.5",
    token: "ETH", 
    usdtValue: 3600.00,  // ❌ Wrong: 1.5 * $2400 (today's price)
    pricePerToken: 2400.00,  // ❌ Wrong: today's ETH price
    timestamp: new Date('2024-01-15T10:30:00Z')  // ✅ Correct: actual tx date
  }
}
*/

// AFTER (Historical pricing - what we have now):
// ==============================================

/*
async function generateReceiptNEW(txHash: string) {
  const txDetails = await blockchainService.getTransactionDetails(txHash)
  
  // This now uses HISTORICAL price from the actual transaction date
  // ETH price on 2024-01-15 was ~$1600, so that's what gets used
  
  return {
    amount: "1.5",
    token: "ETH",
    usdtValue: 2400.00,  // ✅ Correct: 1.5 * $1600 (historical price)
    pricePerToken: 1600.00,  // ✅ Correct: ETH price on Jan 15, 2024
    timestamp: new Date('2024-01-15T10:30:00Z')  // ✅ Correct: actual tx date
  }
}
*/

// DETAILED FLOW:
// ==============

/*
1. User requests PDF for transaction hash: 0xabc123...

2. System calls: blockchainService.getTransactionDetails(txHash)

3. BlockchainService:
   - Fetches transaction from blockchain
   - Gets block timestamp: 1705314600 (Unix timestamp for Jan 15, 2024 10:30 AM)
   - Converts to Date: new Date(1705314600 * 1000)

4. For ERC20 tokens (USDT, DAI, etc.):
   blockchain.service.ts line ~673:
   ```typescript
   const transactionDate = new Date(Number(block.timestamp) * 1000)
   const priceData = await this.priceService.getHistoricalTokenPriceInUSDT(
     tokenSymbol, 
     amount, 
     transactionDate  // ← This is the key change!
   )
   ```

5. For native tokens (ETH, BNB, etc.):
   blockchain.service.ts line ~719:
   ```typescript
   const transactionDate = new Date(Number(block.timestamp) * 1000)
   const priceData = await this.priceService.getHistoricalTokenPriceInUSDT(
     token, 
     amount, 
     transactionDate  // ← This is the key change!
   )
   ```

6. PriceService.getHistoricalTokenPriceInUSDT():
   - Finds token in CoinGecko: "ETH" → "ethereum"
   - Calls CoinGecko history API:
     GET https://api.coingecko.com/api/v3/coins/ethereum/history?date=15-01-2024
   - Gets price: { "market_data": { "current_price": { "usd": 1600.50, "usdt": 1601.20 } } }
   - Calculates: 1.5 ETH * $1600.50 = $2400.75

7. PDF generation gets accurate historical data:
   ```
   Transaction Receipt
   ==================
   Date: January 15, 2024 10:30 AM UTC
   Amount: 1.5 ETH
   USD Value: $2,400.75  ← Historical rate: $1600.50/ETH on Jan 15, 2024
   ```

FALLBACK BEHAVIOR:
==================
If historical data is unavailable (new token, API error, etc.):
- System automatically falls back to current pricing
- Logs the fallback for monitoring
- PDF generation continues without interruption

SUPPORTED SCENARIOS:
===================
✅ ERC20 token transfers (USDT, USDC, DAI, UNI, etc.)
✅ Native token transfers (ETH, BNB, AVAX, MATIC, etc.)  
✅ Multi-chain transactions (Ethereum, Base, Polygon, etc.)
✅ All major cryptocurrencies with CoinGecko data
✅ Automatic fallback to current prices when needed
*/

export const HISTORICAL_PRICING_EXAMPLE = {
  description: "Historical pricing implementation example",
  beforeAfterComparison: {
    before: "Current market price regardless of transaction date",
    after: "Actual price on the day/time of transaction"
  },
  benefits: [
    "Accurate transaction valuation",
    "Consistent with accounting principles", 
    "Better for tax reporting",
    "Reflects true transaction value at the time"
  ]
}