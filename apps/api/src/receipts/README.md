# Receipts Module

This module handles blockchain transaction receipt generation, payment verification, and subscription management.

## Structure

### Module Organization

```
receipts/
├── receipts.module.ts       # Module definition
├── controllers/             # API endpoints
│   └── receipts.controller.ts
├── services/               # Business logic & integrations
│   ├── receipts.service.ts      # Main orchestration
│   ├── blockchain.service.ts    # Blockchain interactions
│   ├── pdf.service.ts          # PDF generation
│   ├── price.service.ts        # Historical pricing
│   └── branding.service.ts     # Branding customization
└── dto/                    # Data Transfer Objects
    ├── pay-and-generate.dto.ts
    ├── purchase-pack.dto.ts
    ├── purchase-subscription.dto.ts
    └── receipt-response.dto.ts
```

### Core Services

- **`blockchain.service.ts`** - Multi-chain blockchain interaction service
  - Transaction verification across 9 networks (Ethereum, Base, Polygon, Arbitrum, Optimism, zkSync, BSC, Avalanche)
  - Payment verification (ETH, USDT, USDC)
  - Transaction details extraction with historical pricing
  - Caching for optimized performance (transaction verification, token metadata, native token info)

- **`receipts.service.ts`** - Main receipt generation service
  - PDF receipt generation with payment verification
  - Free generation management (counter and date-based)
  - Pack and subscription purchases
  - User receipt management

- **`pdf.service.ts`** - PDF generation service
  - Transaction receipt PDF creation with custom branding
  - Support for swaps, ERC20 transfers, and native transfers
  - Historical USD pricing integration
  - Cloud storage upload (AWS S3/Cloudflare R2)

- **`price.service.ts`** - Historical token pricing service
  - CoinGecko API integration for historical prices
  - Token symbol mapping (300+ tokens)
  - Fallback to current prices when historical data unavailable

- **`branding.service.ts`** - Custom branding management
  - Logo, color scheme, company info customization
  - Per-user or default branding configuration

### Additional Files

- **`txDetails.ts`** - Universal transaction details extraction
  - Internal native transfers (trace API)
  - ERC20 transfer decoding
  - Token metadata loading

### Sub-modules

- **`dto/`** - Data Transfer Objects for request validation and response formatting
- **`controllers/`** - REST API endpoint handlers

### Tests

- `receipts.service.free.spec.ts` - Free generation eligibility tests

- **`receipts.service.free.spec.ts`** - Free generation feature tests

### Controller & Module

- **`receipts.controller.ts`** - REST API endpoints for receipt operations
- **`receipts.module.ts`** - NestJS module configuration

## Key Features

### Multi-Network Support
- 9 blockchain networks supported
- Automatic network detection from transaction hash
- Parallel network checks with caching

### Payment Verification
- ETH, USDT, USDC payment support
- Hash-based verification (efficient) with fallback to block scanning
- Configurable network propagation delay

### Caching Strategy
- Transaction verification cache (10 min TTL)
- Token metadata permanent cache
- Native token info cache
- Automatic cleanup of expired entries

### Historical Pricing
- Accurate historical USD values at transaction time
- CoinGecko integration with 300+ token support
- Automatic fallback to current prices

### Free Generation System
- Counter-based free generations
- Date-based subscriptions
- Pack purchases (20 generations)
- Monthly subscriptions (500 generations + 30 days)

## Usage Examples

### Generate Receipt
```typescript
POST /api/receipts/pay-and-generate
{
  "txHash": "0x...",
  "description": "Payment for services",
  "paymentTxHash": "0x...",
  "paymentAmount": 0.001,
  "paymentType": "ETH"
}
```

### Purchase Pack
```typescript
POST /api/receipts/purchase-pack
{
  "paymentTxHash": "0x...",
  "paymentAmount": 9.99,
  "paymentType": "USDT",
  "paymentContractAddress": "0x..."
}
```

### Purchase Subscription
```typescript
POST /api/receipts/purchase-subscription
{
  "paymentTxHash": "0x...",
  "paymentAmount": 29.99,
  "paymentType": "USDC",
  "paymentContractAddress": "0x..."
}
```

## Configuration

Environment variables:
- `VERIFICATION_DELAY_MS` - Network propagation delay (default: 10000ms)
- `PACK_GENERATIONS` - Generations per pack (default: 20)
- `TRACE_RPC_URL` - Optional trace API endpoint for internal transfers
- `*_RPC_URL` - RPC endpoints for each network
- Storage configuration for PDF uploads

## Performance Optimizations

1. **Caching**: Transaction verification, token metadata, native token info
2. **Parallel Operations**: Network checks, database queries, RPC calls
3. **Efficient Verification**: Hash-based payment verification preferred
4. **Resource Management**: Automatic cache cleanup, connection pooling

## Dependencies

- `viem` - Ethereum interactions
- `@nestjs/*` - Framework
- `prisma` - Database ORM
- CoinGecko API - Historical pricing
- Cloud storage - PDF hosting
