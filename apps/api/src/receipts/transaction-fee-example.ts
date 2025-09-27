/**
 * Transaction Fee Feature Example
 * 
 * This demonstrates how transaction fees are now included in PDF receipts
 */

// EXAMPLE TRANSACTION DATA (with fee information):
// ==============================================

const exampleTransactionData = {
  // Basic transaction info
  txHash: "0xabc123...",
  sender: "0x742d35Cc9d34fC6e6B0A...",
  receiver: "0x8ba1f109551bD432803012...",
  amount: "1.5",
  token: "ETH",
  chainId: 1,
  
  // Historical pricing (implemented earlier)
  usdtValue: 2400.00,     // 1.5 ETH * $1600 (historical rate)
  pricePerToken: 1600.00, // ETH price on transaction date
  
  // NEW: Transaction fee data
  gasUsed: "21000",                    // Gas units used
  gasPrice: "20.5",                    // Gas price in Gwei
  transactionFeeEth: 0.0004305,        // Fee in ETH (21000 * 20.5 Gwei)
  transactionFeeUsd: 0.69,             // Fee in USD (0.0004305 ETH * $1600)
  nativeTokenSymbol: "ETH",            // Native token for fees
  
  timestamp: new Date('2024-01-15T10:30:00Z')
}

// HOW IT APPEARS IN PDF:
// ======================

/*
┌─────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN TRANSACTION RECEIPT          │
│                         January 15, 2024                   │
└─────────────────────────────────────────────────────────────┘

SENDERS (INPUTS):
┌───┬─────────────────────────────┬──────────────┬─────────────┐
│ # │ SENDER                      │ VALUE (ETH)  │ VALUE (USD) │
├───┼─────────────────────────────┼──────────────┼─────────────┤
│ 0 │ 0x742d35Cc9d34fC6e6B0A...   │ 1.5          │ $2,400.00   │
├───┼─────────────────────────────┼──────────────┼─────────────┤
│   │ TOTAL:                      │ 1.5 ETH      │ $2,400.00   │
└───┴─────────────────────────────┴──────────────┴─────────────┘

RECIPIENTS (OUTPUTS):
┌───┬─────────────────────────────┬──────────────┬─────────────┐
│ # │ RECIPIENT                   │ VALUE (ETH)  │ VALUE (USD) │
├───┼─────────────────────────────┼──────────────┼─────────────┤
│ 1 │ 0x8ba1f109551bD432803012... │ 1.5          │ $2,400.00   │
├───┼─────────────────────────────┼──────────────┼─────────────┤
│ → │ TOTAL:                      │ 1.5 ETH      │ $2,400.00   │
└───┴─────────────────────────────┴──────────────┴─────────────┘

TRANSACTION FEE:                              👈 NEW SECTION
┌─────────────────────────────┬──────────────┬─────────────┐
│ DESCRIPTION                 │ AMOUNT       │ VALUE (USD) │
├─────────────────────────────┼──────────────┼─────────────┤
│ Network Fee                 │ 0.0004305 ETH│ $0.69       │
└─────────────────────────────┴──────────────┴─────────────┘

TOTAL SUMMARY:                                👈 NEW SECTION
┌─────────────────────────────┬─────────────┐
│ DESCRIPTION                 │ VALUE (USD) │
├─────────────────────────────┼─────────────┤
│ Transaction Amount          │ $2,400.00   │
│ Transaction Fee             │ $0.69       │
├─────────────────────────────┼─────────────┤
│ TOTAL (Amount + Fee)        │ $2,400.69   │ 👈 TOTAL WITH FEE
└─────────────────────────────┴─────────────┘
*/

// IMPLEMENTATION DETAILS:
// ======================

const implementationFlow = {
  "1_blockchain_service": {
    description: "Calculates transaction fee using gas data",
    method: "calculateTransactionFee()",
    inputs: ["gasUsed", "gasPrice", "nativeTokenSymbol", "transactionDate"],
    outputs: {
      transactionFeeEth: "Fee in native token (ETH, BNB, etc.)",
      transactionFeeUsd: "Fee in USD using historical prices",
      gasUsedFormatted: "Gas units as string",
      gasPriceGwei: "Gas price in Gwei"
    }
  },
  
  "2_receipts_service": {
    description: "Passes fee data to PDF service",
    additionalFields: [
      "gasUsed",
      "gasPrice", 
      "transactionFeeEth",
      "transactionFeeUsd",
      "nativeTokenSymbol"
    ]
  },
  
  "3_pdf_service": {
    description: "Renders fee information in PDF",
    newSections: [
      "Transaction Fee table",
      "Total Summary table with grand total"
    ]
  }
}

// BENEFITS:
// =========

const benefits = [
  "Complete transaction cost visibility",
  "Accurate accounting for tax purposes", 
  "Historical fee costs at transaction time",
  "Professional receipt format",
  "Multi-network support (ETH, BNB, MATIC fees)",
  "Automatic USD conversion of fees"
]

// SUPPORTED NETWORKS FOR FEES:
// ============================

const supportedNetworks = {
  1: { name: "Ethereum", feeToken: "ETH" },
  8453: { name: "Base", feeToken: "ETH" },
  137: { name: "Polygon", feeToken: "MATIC" },
  56: { name: "BNB Smart Chain", feeToken: "BNB" },
  43114: { name: "Avalanche", feeToken: "AVAX" },
  10: { name: "Optimism", feeToken: "ETH" },
  42161: { name: "Arbitrum", feeToken: "ETH" }
}

export {
  exampleTransactionData,
  implementationFlow,
  benefits,
  supportedNetworks
}