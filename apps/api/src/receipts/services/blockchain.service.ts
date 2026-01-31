import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createPublicClient, http, parseAbi, parseAbiItem, formatUnits, PublicClient, decodeEventLog, Chain } from 'viem'
import { mainnet, base, baseSepolia, polygon, arbitrum, optimism, zkSync, bsc, avalanche } from 'viem/chains'
import { PriceService } from './price.service'

interface NetworkConfig {
  name: string
  chainId: number
  chain: any
  rpcUrl: string
  explorerBaseUrl: string
  client?: PublicClient
}

interface TransactionDetails {
  sender: string
  receiver: string
  amount: string
  token: string
  timestamp: Date
  blockNumber: number
  chainId: number
  explorerUrl: string
  usdtValue?: number
  pricePerToken?: number
  status?: 'success' | 'reverted' | 'pending'
  // Transaction fee data  
  gasUsed?: string
  gasPrice?: string
  transactionFeeEth?: number  // Fee in ETH (or native token)
  transactionFeeUsd?: number  // Fee in USD
  nativeTokenSymbol?: string  // ETH, BNB, MATIC, etc.
}

export interface ExtendedTransactionDetails {
  hash: string
  sender: string
  receiver: string
  amount: string
  token: string
  timestamp: Date
  blockNumber: number
  chainId: number
  explorerUrl: string
  blockHash: string
  transactionIndex: number
  gasUsed: string
  gasPrice: string
  gasLimit: string
  nonce: number
  status: 'success' | 'reverted' | 'pending'
  confirmations: number
  value: string // Raw value in wei
  input: string // Transaction data
  logs: any[]
  contractAddress?: string
  usdtValue?: number
  pricePerToken?: number
}

export interface SwapLeg {
  from: string
  to: string
  amount: string
  token: string
  usdValue?: number
}

interface TransactionCacheEntry {
  exists: boolean
  network?: NetworkConfig
  timestamp: number
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name)
  private publicClient // Legacy single client for compatibility
  private readonly networks: Map<string, NetworkConfig> = new Map()
  private readonly usdtContract: string
  private readonly serviceAddress: string
  private readonly serviceUsdtAddress?: string
  
  // Transaction verification cache
  private readonly txVerificationCache: Map<string, TransactionCacheEntry> = new Map()
  private readonly CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
  private cacheCleanupInterval: NodeJS.Timeout | null = null
  
  // Token metadata cache (symbol, decimals never change)
  private readonly tokenInfoCache: Map<string, { symbol: string; decimals: number }> = new Map()
  
  // Native token info cache
  private readonly nativeTokenCache: Map<number, { symbol: string; decimals: number }> = new Map()

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => PriceService))
    private readonly priceService: PriceService
  ) {
    this.usdtContract = configService.get('USDT_CONTRACT')
    this.serviceAddress = configService.get('SERVICE_ETH_ADDRESS')
    this.serviceUsdtAddress = configService.get('SERVICE_USDT_ADDRESS') || this.serviceAddress
    
    // Initialize all supported networks
    this.initializeNetworks()
    
    // Start cache cleanup interval (every 2 minutes)
    this.startCacheCleanup()
  }

  private startCacheCleanup() {
    // Clean up expired cache entries every 2 minutes
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredCache()
    }, 2 * 60 * 1000)
  }

  private cleanupExpiredCache() {
    const now = Date.now()
    let removedCount = 0
    
    for (const [txHash, entry] of this.txVerificationCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this.txVerificationCache.delete(txHash)
        removedCount++
      }
    }
    
    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} expired cache entries. Cache size: ${this.txVerificationCache.size}`)
    }
  }

  onModuleDestroy() {
    // Clean up interval on module destruction
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval)
      this.cacheCleanupInterval = null
    }
  }

  private initializeNetworks() {
    const networkConfigs: NetworkConfig[] = [
      {
        name: 'Ethereum Mainnet',
        chainId: 1,
        chain: mainnet,
        rpcUrl: this.configService.get('ETHEREUM_RPC_URL') || 'https://ethereum-rpc.publicnode.com',
        explorerBaseUrl: 'https://etherscan.io'
      },
      {
        name: 'Base Mainnet',
        chainId: 8453,
        chain: base,
        rpcUrl: this.configService.get('BASE_RPC_URL') || 'https://mainnet.base.org',
        explorerBaseUrl: 'https://basescan.org'
      },
      {
        name: 'Base Sepolia',
        chainId: 84532,
        chain: baseSepolia,
        rpcUrl: this.configService.get('ALCHEMY_BASE_RPC') || 'https://sepolia.base.org',
        explorerBaseUrl: 'https://sepolia.basescan.org'
      },
      {
        name: 'Polygon Mainnet',
        chainId: 137,
        chain: polygon,
        rpcUrl: this.configService.get('POLYGON_RPC_URL') || 'https://polygon-rpc.com',
        explorerBaseUrl: 'https://polygonscan.com'
      },
      {
        name: 'Arbitrum One',
        chainId: 42161,
        chain: arbitrum,
        rpcUrl: this.configService.get('ARBITRUM_RPC_URL') || 'https://arb1.arbitrum.io/rpc',
        explorerBaseUrl: 'https://arbiscan.io'
      },
      {
        name: 'Optimism Mainnet',
        chainId: 10,
        chain: optimism,
        rpcUrl: this.configService.get('OPTIMISM_RPC_URL') || 'https://mainnet.optimism.io',
        explorerBaseUrl: 'https://optimistic.etherscan.io'
      },
      {
        name: 'zkSync Era',
        chainId: 324,
        chain: zkSync,
        rpcUrl: this.configService.get('ZKSYNC_RPC_URL') || 'https://mainnet.era.zksync.io',
        explorerBaseUrl: 'https://explorer.zksync.io'
      },
      {
        name: 'BNB Smart Chain',
        chainId: 56,
        chain: bsc,
        rpcUrl: this.configService.get('BSC_RPC_URL') || 'https://bsc-dataseed1.binance.org',
        explorerBaseUrl: 'https://bscscan.com'
      },
      {
        name: 'Avalanche C-Chain',
        chainId: 43114,
        chain: avalanche,
        rpcUrl: this.configService.get('AVALANCHE_RPC_URL') || 'https://api.avax.network/ext/bc/C/rpc',
        explorerBaseUrl: 'https://snowtrace.io'
      }
    ]

    // Initialize clients for all networks
    for (const config of networkConfigs) {
      try {
        config.client = createPublicClient({
          chain: config.chain,
          transport: http(config.rpcUrl),
        })
        
        this.networks.set(config.chainId.toString(), config)
        this.networks.set(`0x${config.chainId.toString(16)}`, config) // Also store hex format
        
        this.logger.log(`Initialized ${config.name} client (Chain ID: ${config.chainId})`)
      } catch (error) {
        this.logger.warn(`Failed to initialize ${config.name} client: ${error.message}`)
      }
    }

    // Set legacy client to Base Sepolia for backward compatibility
    const baseSepoliaConfig = this.networks.get('84532')
    if (baseSepoliaConfig?.client) {
      this.publicClient = baseSepoliaConfig.client
      this.logger.log('Legacy client set to Base Sepolia for backward compatibility')
    }
  }

  private getNativeTokenInfo(chainId: number): { symbol: string; decimals: number } {
    // Check cache first
    const cached = this.nativeTokenCache.get(chainId)
    if (cached) {
      return cached
    }
    
    let result: { symbol: string; decimals: number }
    
    switch (chainId) {
      case 1: // Ethereum Mainnet
        result = { symbol: 'ETH', decimals: 18 }
        break
      case 8453: // Base Mainnet
        result = { symbol: 'ETH', decimals: 18 }
        break
      case 84532: // Base Sepolia
        result = { symbol: 'ETH', decimals: 18 }
        break
      case 137: // Polygon Mainnet
        result = { symbol: 'POL', decimals: 18 }
        break
      case 10: // Optimism Mainnet
        result = { symbol: 'ETH', decimals: 18 }
        break
      case 42161: // Arbitrum One
        result = { symbol: 'ETH', decimals: 18 }
        break
      case 324: // zkSync Era
        result = { symbol: 'ETH', decimals: 18 }
        break
      case 56: // BNB Smart Chain
        result = { symbol: 'BNB', decimals: 18 }
        break
      case 43114: // Avalanche C-Chain
        result = { symbol: 'AVAX', decimals: 18 }
        break
      default:
        result = { symbol: 'ETH', decimals: 18 } // Default fallback
    }
    
    // Cache the result
    this.nativeTokenCache.set(chainId, result)
    return result
  }

  private async getTokenInfo(contractAddress: string, network: NetworkConfig): Promise<{ symbol: string; decimals: number } | null> {
    if (!network.client) {
      return null
    }

    // Create cache key with network chainId to avoid collisions across networks
    const cacheKey = `${network.chainId}:${contractAddress.toLowerCase()}`
    
    // Check cache first
    const cached = this.tokenInfoCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // ERC20 ABI for symbol and decimals
      const erc20Abi = parseAbi([
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)'
      ])

      // Get token symbol and decimals in parallel
      const [symbol, decimals] = await Promise.all([
        network.client.readContract({
          address: contractAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
        network.client.readContract({
          address: contractAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'decimals',
        })
      ])

      const result = {
        symbol: symbol as string,
        decimals: Number(decimals)
      }
      
      // Cache the result permanently (token metadata never changes)
      this.tokenInfoCache.set(cacheKey, result)
      
      return result
    } catch (error) {
      this.logger.warn(`Failed to get token info for ${contractAddress}:`, error.message)
      // Fallback to common token addresses
      const address = contractAddress.toLowerCase()
      
      let fallbackResult: { symbol: string; decimals: number } | null = null
      
      // Common USDT addresses across networks
      if (address === '0xdac17f958d2ee523a2206206994597c13d831ec7' || // Ethereum USDT
          address === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' || // Polygon USDT
          address === '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9') { // Arbitrum USDT
        fallbackResult = { symbol: 'USDT', decimals: 6 }
      }
      // Common USDC addresses
      else if (address === '0xa0b86a33e6351b8b8b53eebf3c7f65b3e9b5ae8d' || // Base USDC
          address === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' || // Polygon USDC
          address === '0xa0b86a33e6351b8b8b53eebf3c7f65b3e9b5ae8d') { // Ethereum USDC
        fallbackResult = { symbol: 'USDC', decimals: 6 }
      }
      else {
        fallbackResult = { symbol: 'TOKEN', decimals: 18 } // Default fallback
      }
      
      // Cache fallback result too
      if (fallbackResult) {
        this.tokenInfoCache.set(cacheKey, fallbackResult)
      }
      
      return fallbackResult
    }
  }

  async verifyETHPayment(fromAddress: string, expectedAmount: number): Promise<boolean> {
    if (!this.publicClient) {
      this.logger.error('Blockchain client not available, cannot verify payment')
      return false
    }
    
    try {
      // Look for recent ETH transfers to service address from user
      const currentBlock = await this.publicClient.getBlockNumber()
      const fromBlock = currentBlock - BigInt(5_000)  // Look back fewer blocks for efficiency

      // Convert ETH to wei with some tolerance for rounding
      const expectedAmountWei = BigInt(Math.floor(expectedAmount * 1e18))
      const tolerance = BigInt(Math.floor(0.000001 * 1e18)) // 0.000001 ETH tolerance
      
      // Check recent blocks for ETH transfers (limit to recent blocks for efficiency)
      for (let blockNum = Math.max(Number(fromBlock), Number(currentBlock) - 50); blockNum <= currentBlock; blockNum++) {
        try {
          const block = await this.publicClient.getBlock({
            blockNumber: BigInt(blockNum),
            includeTransactions: true
          })
          
          for (const tx of block.transactions) {
            if (typeof tx === 'object' && 
                tx.from?.toLowerCase() === fromAddress.toLowerCase() &&
                tx.to?.toLowerCase() === this.serviceAddress.toLowerCase()) {
              
              // Check if value is within tolerance
              const diff = tx.value > expectedAmountWei ? 
                tx.value - expectedAmountWei : 
                expectedAmountWei - tx.value
              
              if (diff <= tolerance) {
                this.logger.log(`ETH payment verified: ${fromAddress} -> ${this.serviceAddress}`)
                return true
              }
            }
          }
        } catch (blockError) {
          this.logger.warn(`Error checking block ${blockNum}:`, blockError)
          continue
        }
      }

      this.logger.warn(`ETH payment not found: ${fromAddress} -> ${this.serviceAddress}`)
      return false
    } catch (error) {
      this.logger.error('Error verifying ETH payment:', error)
      return false
    }
  }

  /**
   * Verify ETH payment by transaction hash - much more efficient than scanning blocks
   */
  async verifyETHPaymentByHash(paymentTxHash: string, fromAddress: string, expectedAmount: number): Promise<boolean> {
    try {
      // Find which network the payment transaction is on
      const network = await this.findTransactionNetwork(paymentTxHash)
      if (!network || !network.client) {
        this.logger.error(`Payment transaction ${paymentTxHash} not found in any supported network`)
        return false
      }

      // Get the transaction details
      const transaction = await network.client.getTransaction({
        hash: paymentTxHash as `0x${string}`,
      })

      if (!transaction) {
        this.logger.error(`Payment transaction ${paymentTxHash} not found`)
        return false
      }

      // Get transaction receipt to check if it was successful
      const receipt = await network.client.getTransactionReceipt({
        hash: paymentTxHash as `0x${string}`,
      })

      if (receipt.status !== 'success') {
        this.logger.warn(`Payment transaction ${paymentTxHash} was not successful`)
        return false
      }

      // Verify payment details
      const isCorrectSender = transaction.from?.toLowerCase() === fromAddress.toLowerCase()
      const isCorrectReceiver = transaction.to?.toLowerCase() === this.serviceAddress.toLowerCase()
      
      // Convert expected amount to wei with tolerance
      const expectedAmountWei = BigInt(Math.floor(expectedAmount * 1e18))
      const tolerance = BigInt(Math.floor(0.000001 * 1e18)) // 0.000001 ETH tolerance
      
      const diff = transaction.value > expectedAmountWei ? 
        transaction.value - expectedAmountWei : 
        expectedAmountWei - transaction.value
      
      const isCorrectAmount = diff <= tolerance

      if (isCorrectSender && isCorrectReceiver && isCorrectAmount) {
        this.logger.log(`ETH payment verified: ${paymentTxHash}`)
        return true
      } else {
        this.logger.warn(`Payment verification failed for ${paymentTxHash}`)
        return false
      }
    } catch (error) {
      this.logger.error(`Error verifying ETH payment by hash ${paymentTxHash}:`, error)
      return false
    }
  }

  /**
   * Verify token payment by transaction hash - efficient verification for ERC20 tokens
   */
  async verifyTokenPaymentByHash(
    paymentTxHash: string, 
    fromAddress: string, 
    contractAddress: string,
    expectedAmount: number,
    tokenSymbol: string,
    decimals: number = 6
  ): Promise<boolean> {
    try {
      // Find which network the payment transaction is on
      const network = await this.findTransactionNetwork(paymentTxHash)
      if (!network || !network.client) {
        this.logger.error(`Payment transaction ${paymentTxHash} not found in any supported network`)
        return false
      }

      // Get the transaction receipt to check logs
      const receipt = await network.client.getTransactionReceipt({
        hash: paymentTxHash as `0x${string}`,
      })

      if (receipt.status !== 'success') {
        this.logger.warn(`Payment transaction ${paymentTxHash} was not successful`)
        return false
      }

      // Parse Transfer events from logs
      const transferEventAbi = parseAbi([
        'event Transfer(address indexed from, address indexed to, uint256 value)'
      ])

      for (const log of receipt.logs) {
        try {
          // Check if this log is from the expected contract
          if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
            continue
          }

          // Try to decode as Transfer event
          const decoded = decodeEventLog({
            abi: transferEventAbi,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName === 'Transfer') {
            const args = decoded.args as {
              from: string
              to: string
              value: bigint
            }

            // Check if this is the payment we're looking for
            const isCorrectSender = args.from.toLowerCase() === fromAddress.toLowerCase()
            const isCorrectReceiver = args.to.toLowerCase() === this.serviceAddress.toLowerCase()

            if (isCorrectSender && isCorrectReceiver) {
              // Convert expected amount to token units
              const expectedAmountUnits = BigInt(Math.floor(expectedAmount * Math.pow(10, decimals)))
              const tolerance = BigInt(Math.floor(0.01 * Math.pow(10, decimals))) // 0.01 token tolerance

              const diff = args.value > expectedAmountUnits ? 
                args.value - expectedAmountUnits : 
                expectedAmountUnits - args.value

              if (diff <= tolerance) {
                this.logger.log(`${tokenSymbol} payment verified: ${paymentTxHash}`)
                return true
              } else {
                this.logger.warn(`${tokenSymbol} payment amount mismatch in ${paymentTxHash}`)
              }
            }
          }
        } catch (decodeError) {
          // Skip logs that can't be decoded as Transfer events
          continue
        }
      }

      this.logger.warn(`${tokenSymbol} payment not found in transaction ${paymentTxHash}`)
      return false
    } catch (error) {
      this.logger.error(`Error verifying ${tokenSymbol} payment by hash ${paymentTxHash}:`, error)
      return false
    }
  }

  async verifyUSDTPayment(fromAddress: string, minAmount: number = 1): Promise<boolean> {
    try {
      const baseChainId = parseInt(this.configService.get('BASE_CHAIN_ID') || '8453')
      const network = this.networks.get(baseChainId.toString())

      if (!network || !network.client) {
        this.logger.error(`Base network client not available for chainId ${baseChainId}`)
        return false
      }

      if (!this.usdtContract) {
        this.logger.error('USDT_CONTRACT not configured')
        return false
      }

      if (!this.serviceUsdtAddress) {
        this.logger.error('SERVICE_USDT_ADDRESS or SERVICE_ETH_ADDRESS not configured')
        return false
      }

      const client = network.client
      const currentBlock = await client.getBlockNumber()
      const lookback = BigInt(5_000) // ~5000 blocks
      const fromBlock = currentBlock > lookback ? currentBlock - lookback : 0n

      const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

      // Filter by indexed args (from, to)
      const logs = await client.getLogs({
        address: this.usdtContract as `0x${string}`,
        event: transferEvent,
        fromBlock,
        toBlock: currentBlock,
        args: {
          from: fromAddress as `0x${string}`,
          to: this.serviceUsdtAddress as `0x${string}`,
        },
      })

      const minUnits = BigInt(Math.round(minAmount * 1_000_000)) // USDT has 6 decimals

      for (const log of logs) {
        const value = (log as any).args?.value as bigint | undefined
        if (typeof value === 'bigint' && value >= minUnits) {
          this.logger.log(`USDT payment verified from ${fromAddress}`)
          return true
        }
      }

      this.logger.warn(`USDT payment not found from ${fromAddress}`)
      return false
    } catch (error) {
      this.logger.error('Error verifying USDT payment:', error)
      return false
    }
  }

  async getExtendedTransactionDetails(txHash: string): Promise<ExtendedTransactionDetails | null> {
    // First find which network contains this transaction
    const network = await this.findTransactionNetwork(txHash)
    if (!network || !network.client) {
      this.logger.error(`Transaction ${txHash} not found in any supported network or client not available`)
      return null
    }
    
    try {
      // Fetch transaction, receipt, and current block in parallel
      const [transaction, receipt, currentBlock] = await Promise.all([
        network.client.getTransaction({
          hash: txHash as `0x${string}`,
        }),
        network.client.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        }),
        network.client.getBlockNumber()
      ])

      if (!transaction) {
        return null
      }

      // Fetch block data
      const block = await network.client.getBlock({
        blockNumber: transaction.blockNumber,
      })

      const confirmations = Number(currentBlock - transaction.blockNumber)
      
      // Get basic transaction details using the same network
      const basicDetails = await this.getTransactionDetailsFromNetwork(txHash, network)
      if (!basicDetails) {
        return null
      }

      return {
        hash: txHash,
        sender: basicDetails.sender,
        receiver: basicDetails.receiver,
        amount: basicDetails.amount,
        token: basicDetails.token,
        timestamp: basicDetails.timestamp,
        blockNumber: basicDetails.blockNumber,
        chainId: network.chainId,
        explorerUrl: `${network.explorerBaseUrl}/tx/${txHash}`,
        blockHash: block.hash,
        transactionIndex: transaction.transactionIndex || 0,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: formatUnits(transaction.gasPrice || 0n, 9), // Gwei
        gasLimit: transaction.gas.toString(),
        nonce: transaction.nonce,
        status: receipt.status === 'success' ? 'success' : 'reverted',
        confirmations,
        value: transaction.value.toString(),
        input: transaction.input,
        logs: receipt.logs.map(log => ({
          address: log.address,
          topics: log.topics,
          data: log.data,
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
        })),
        contractAddress: receipt.contractAddress || undefined,
        usdtValue: basicDetails.usdtValue,
        pricePerToken: basicDetails.pricePerToken,
      }
    } catch (error) {
      this.logger.error(`Error getting extended transaction details for ${txHash}:`, error)
      return null
    }
  }

  /**
   * Extract potential swap legs by decoding ERC20 Transfer events in a transaction.
   * If more than 2 distinct transfers across different token contracts are found,
   * we consider it a swap/multi-hop sequence.
   */
  async extractSwapLegs(txHash: string, transactionDate?: Date): Promise<SwapLeg[]> {
    try {
      const details = await this.getExtendedTransactionDetails(txHash)
      if (!details) return []

      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      const legs: SwapLeg[] = []
      const uniqueTokens = new Set<string>()

      for (const log of details.logs) {
        if (!log.topics || log.topics.length < 3) continue
        const topic0 = log.topics[0]?.toLowerCase()
        if (topic0 !== transferTopic) continue

        const contractAddress: string = log.address
        // Decode indexed parameters (from, to) are topics[1], topics[2]
        const fromRaw = '0x' + log.topics[1].slice(26)
        const toRaw = '0x' + log.topics[2].slice(26)

        // Value is in data (uint256)
        let valueBig: bigint
        try {
          valueBig = BigInt(log.data)
        } catch {
          continue
        }

        // Fetch token symbol & decimals (best-effort)
        let symbol = contractAddress
        let decimals = 18
        try {
          const clientNetwork = await this.findTransactionNetwork(txHash)
          if (clientNetwork?.client) {
            const erc20Abi = parseAbi([
              'function symbol() view returns (string)',
              'function decimals() view returns (uint8)'
            ])
            const [sym, dec] = await Promise.all([
              clientNetwork.client.readContract({
                abi: erc20Abi,
                address: contractAddress as `0x${string}`,
                functionName: 'symbol'
              }).catch(() => contractAddress),
              clientNetwork.client.readContract({
                abi: erc20Abi,
                address: contractAddress as `0x${string}`,
                functionName: 'decimals'
              }).catch(() => 18)
            ])
            if (typeof sym === 'string') symbol = sym
            if (typeof dec === 'number') decimals = dec
          }
        } catch {
          // ignore failures
        }

        const amount = (Number(valueBig) / 10 ** decimals).toString()
        uniqueTokens.add(symbol)

        let usdValue: number | undefined
        if (transactionDate) {
          try {
            const priceData = await this.priceService.getHistoricalTokenPriceInUSDT(symbol, amount, transactionDate)
            if (priceData) usdValue = priceData.usdtValue
          } catch {
                 // ignore failures
          }
        }

        legs.push({ from: fromRaw, to: toRaw, amount, token: symbol, usdValue })
      }

      // New behavior: return all decoded transfer legs (even single token or few events)
      return legs
    } catch (e) {
      this.logger.warn('Failed to extract swap legs', { txHash, error: (e as Error).message })
      return []
    }
  }

  /**
   * Calculate transaction fee in native token and USD
   */
  private async calculateTransactionFee(
    gasUsed: bigint, 
    gasPrice: bigint, 
    nativeTokenSymbol: string,
    transactionDate: Date
  ): Promise<{ 
    transactionFeeEth: number; 
    transactionFeeUsd?: number; 
    gasUsedFormatted: string;
    gasPriceGwei: string;
  }> {
    // Calculate fee in native token (ETH, BNB, MATIC, etc.)
    const feeInWei = gasUsed * gasPrice
    const transactionFeeEth = parseFloat(formatUnits(feeInWei, 18))
    
    // Format gas values for display
    const gasUsedFormatted = gasUsed.toString()
    const gasPriceGwei = formatUnits(gasPrice, 9) // Convert to Gwei
    
    // Get historical price for native token to calculate USD fee
    let transactionFeeUsd: number | undefined
    
    try {
      const priceData = await this.priceService.getHistoricalTokenPriceInUSDT(
        nativeTokenSymbol, 
        transactionFeeEth.toString(), 
        transactionDate
      )
      if (priceData) {
        transactionFeeUsd = priceData.usdtValue
      }
    } catch (error) {
      this.logger.warn(`Failed to get historical price for transaction fee in ${nativeTokenSymbol}:`, error.message)
    }
    
    return {
      transactionFeeEth,
      transactionFeeUsd,
      gasUsedFormatted,
      gasPriceGwei
    }
  }

  async getTransactionDetails(txHash: string): Promise<TransactionDetails | null> {
    // First find which network contains this transaction
    const network = await this.findTransactionNetwork(txHash)
    if (!network || !network.client) {
      this.logger.error(`Transaction ${txHash} not found in any supported network or client not available`)
      return null
    }

    return this.getTransactionDetailsFromNetwork(txHash, network)
  }

  private async getTransactionDetailsFromNetwork(txHash: string, network: NetworkConfig): Promise<TransactionDetails | null> {
    if (!network.client) {
      this.logger.error(`Client not available for network ${network.name}`)
      return null
    }
    
    try {
      // Fetch transaction and receipt in parallel for better performance
      const [transaction, receipt] = await Promise.all([
        network.client.getTransaction({
          hash: txHash as `0x${string}`,
        }),
        network.client.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        })
      ])

      if (!transaction) {
        return null
      }

      // Fetch block data
      const block = await network.client.getBlock({
        blockNumber: transaction.blockNumber,
      })

      // First check for ERC20 transfers in logs (highest priority)
      if (receipt.logs.length > 0) {
        const transferEventAbi = parseAbi([
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ])

        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i]
          
          try {
            // Check if this is a Transfer event by trying to decode
            const decoded = decodeEventLog({
              abi: transferEventAbi,
              data: log.data,
              topics: log.topics,
            })

            if (decoded.eventName === 'Transfer') {
              const args = decoded.args as {
                from: string
                to: string
                value: bigint
              }
              
              // Get token info dynamically from contract (now cached)
              const tokenInfo = await this.getTokenInfo(log.address, network)
              const decimals = tokenInfo?.decimals || 18
              const tokenSymbol = tokenInfo?.symbol || 'TOKEN'

              const amount = formatUnits(args.value, decimals)
              
              // Get USDT conversion using historical price at transaction time
              let usdtValue: number | undefined
              let pricePerToken: number | undefined
              
              const transactionDate = new Date(Number(block.timestamp) * 1000)
              
              try {
                const priceData = await this.priceService.getHistoricalTokenPriceInUSDT(tokenSymbol, amount, transactionDate)
                if (priceData) {
                  usdtValue = priceData.usdtValue
                  pricePerToken = priceData.pricePerToken
                }
              } catch (error) {
                this.logger.warn(`Failed to get historical price for ${tokenSymbol}:`, error.message)
              }

              // Calculate transaction fee (native token info now cached)
              const nativeTokenInfo = this.getNativeTokenInfo(network.chainId)
              const feeData = await this.calculateTransactionFee(
                receipt.gasUsed,
                transaction.gasPrice || 0n,
                nativeTokenInfo.symbol,
                transactionDate
              )

              return {
                sender: args.from,
                receiver: args.to,
                amount,
                token: tokenSymbol,
                timestamp: transactionDate,
                blockNumber: Number(transaction.blockNumber),
                chainId: network.chainId,
                explorerUrl: `${network.explorerBaseUrl}/tx/${txHash}`,
                usdtValue,
                pricePerToken,
                status: receipt.status === 'success' ? 'success' as const : receipt.status === 'reverted' ? 'reverted' as const : 'pending' as const,
                gasUsed: feeData.gasUsedFormatted,
                gasPrice: feeData.gasPriceGwei,
                transactionFeeEth: feeData.transactionFeeEth,
                transactionFeeUsd: feeData.transactionFeeUsd,
                nativeTokenSymbol: nativeTokenInfo.symbol
              }
            }
          } catch (decodeError) {
            // Skip logs that can't be decoded as Transfer events
            continue
          }
        }
      }

      // For native token transfers (only if no ERC20 transfers found)
      const nativeTokenInfo = this.getNativeTokenInfo(network.chainId)
      const transactionDate = new Date(Number(block.timestamp) * 1000)
      
      if (transaction.to && transaction.value > 0) {
        const amount = formatUnits(transaction.value, nativeTokenInfo.decimals)
        const token = nativeTokenInfo.symbol
        
        // Get USDT conversion using historical price at transaction time
        let usdtValue: number | undefined
        let pricePerToken: number | undefined
        
        try {
          const priceData = await this.priceService.getHistoricalTokenPriceInUSDT(token, amount, transactionDate)
          if (priceData) {
            usdtValue = priceData.usdtValue
            pricePerToken = priceData.pricePerToken
          }
        } catch (error) {
          this.logger.warn(`Failed to get historical price for ${token}:`, error.message)
        }

        // Calculate transaction fee
        const feeData = await this.calculateTransactionFee(
          receipt.gasUsed,
          transaction.gasPrice || 0n,
          token,
          transactionDate
        )

        return {
          sender: transaction.from,
          receiver: transaction.to,
          amount,
          token,
          timestamp: transactionDate,
          blockNumber: Number(transaction.blockNumber),
          chainId: network.chainId,
          explorerUrl: `${network.explorerBaseUrl}/tx/${txHash}`,
          usdtValue,
          pricePerToken,
          status: receipt.status === 'success' ? 'success' as const : receipt.status === 'reverted' ? 'reverted' as const : 'pending' as const,
          gasUsed: feeData.gasUsedFormatted,
          gasPrice: feeData.gasPriceGwei,
          transactionFeeEth: feeData.transactionFeeEth,
          transactionFeeUsd: feeData.transactionFeeUsd,
          nativeTokenSymbol: token
        }
      }
      
      // If no transfers found, return basic transaction info
      const amount = formatUnits(transaction.value, nativeTokenInfo.decimals)
      const token = nativeTokenInfo.symbol
      
      // Get USDT conversion using historical price at transaction time
      let usdtValue: number | undefined
      let pricePerToken: number | undefined
      
      try {
        const priceData = await this.priceService.getHistoricalTokenPriceInUSDT(token, amount, transactionDate)
        if (priceData) {
          usdtValue = priceData.usdtValue
          pricePerToken = priceData.pricePerToken
        }
      } catch (error) {
        this.logger.warn(`Failed to get historical price for ${token}:`, error.message)
      }

      // Calculate transaction fee
      const feeData = await this.calculateTransactionFee(
        receipt.gasUsed,
        transaction.gasPrice || 0n,
        token,
        transactionDate
      )

      return {
        sender: transaction.from,
        receiver: transaction.to || '0x0000000000000000000000000000000000000000',
        amount,
        token,
        timestamp: transactionDate,
        blockNumber: Number(transaction.blockNumber),
        chainId: network.chainId,
        explorerUrl: `${network.explorerBaseUrl}/tx/${txHash}`,
        usdtValue,
        pricePerToken,
        status: receipt.status === 'success' ? 'success' : receipt.status === 'reverted' ? 'reverted' : 'pending',
        gasUsed: feeData.gasUsedFormatted,
        gasPrice: feeData.gasPriceGwei,
        transactionFeeEth: feeData.transactionFeeEth,
        transactionFeeUsd: feeData.transactionFeeUsd,
        nativeTokenSymbol: token
      }
    } catch (error) {
      this.logger.error(`Error getting transaction details for ${txHash} from ${network.name}:`, error)
      return null
    }
  }

  async verifyTransactionExists(txHash: string): Promise<boolean> {
    // Check if transaction exists in any supported network
    return this.verifyTransactionExistsInNetworks(txHash)
  }

  async verifyTransactionExistsInNetworks(txHash: string): Promise<boolean> {
    // Check cache first
    const cached = this.txVerificationCache.get(txHash)
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      return cached.exists
    }
    
    // Create promises for all network checks
    const checkPromises = Array.from(this.networks.values()).map(async (network) => {
      if (!network.client) {
        return { network: network.name, exists: false, error: 'Client not available' }
      }

      try {
        const transaction = await network.client.getTransaction({
          hash: txHash as `0x${string}`,
        })

        const exists = !!transaction
        
        return { 
          network: network.name, 
          chainId: network.chainId,
          exists, 
          transaction: exists ? transaction : null 
        }
      } catch (error) {
        return { network: network.name, chainId: network.chainId, exists: false, error: error.message }
      }
    })

    try {
      // Wait for all network checks to complete
      const results = await Promise.all(checkPromises)
      
      // Return true if transaction exists in any network
      const foundNetworks = results.filter(result => result.exists)
      
      const exists = foundNetworks.length > 0
      
      // Cache the result
      this.txVerificationCache.set(txHash, {
        exists,
        timestamp: Date.now()
      })
      
      if (!exists) {
        this.logger.warn(`Transaction ${txHash} not found in any supported network`)
      }
      
      return exists
    } catch (error) {
      this.logger.error(`Error during multi-network verification for ${txHash}:`, error)
      return false
    }
  }

  async findTransactionNetwork(txHash: string): Promise<NetworkConfig | null> {
    // Check cache first
    const cached = this.txVerificationCache.get(txHash)
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      if (cached.network) {
        return cached.network
      } else if (!cached.exists) {
        return null
      }
    }
    
    // Create promises for all network checks
    const checkPromises = Array.from(this.networks.values()).map(async (network) => {
      if (!network.client) {
        return { network, exists: false, error: 'Client not available' }
      }

      try {
        const transaction = await network.client.getTransaction({
          hash: txHash as `0x${string}`,
        })

        const exists = !!transaction
        return { 
          network, 
          exists, 
          transaction: exists ? transaction : null 
        }
      } catch (error) {
        return { network, exists: false, error: error.message }
      }
    })

    try {
      // Use Promise.race with early exit optimization
      // As soon as we find the transaction in any network, we can stop
      const results = await Promise.all(checkPromises)
      
      // Find the first network where transaction exists
      const foundResult = results.find(result => result.exists)
      
      // Cache the result
      if (foundResult) {
        this.txVerificationCache.set(txHash, {
          exists: true,
          network: foundResult.network,
          timestamp: Date.now()
        })
        return foundResult.network
      } else {
        this.txVerificationCache.set(txHash, {
          exists: false,
          timestamp: Date.now()
        })
        this.logger.warn(`Transaction ${txHash} not found in any supported network`)
        return null
      }
    } catch (error) {
      this.logger.error(`Error finding network for transaction ${txHash}:`, error)
      return null
    }
  }

  // Keep the old method for backward compatibility but make it use the new multi-network approach
  async verifyTransactionExistsLegacy(txHash: string): Promise<boolean> {
    if (!this.publicClient) {
      this.logger.error('Blockchain client not available')
      return false
    }

    try {
      const transaction = await this.publicClient.getTransaction({
        hash: txHash as `0x${string}`,
      })

      return !!transaction
    } catch (error) {
      this.logger.warn(`Transaction verification failed for ${txHash}:`, error)
      return false
    }
  }

  /**
   * Wrapper around universal getTxDetails utility.
   * Attempts to resolve the network automatically if chainId not provided.
   * Returns detailed receipt, internal native transfers (trace) and ERC20 transfers.
   */
  async getUniversalTxDetails(params: {
    hash: string
    chainId?: number
    traceRpcUrl?: string
    loadTokenMeta?: boolean
  }): Promise<{
    networkName: string
    chainId: number
    explorerUrl: string
    receipt: any
    internalNativeTransfers: any[]
    erc20Transfers: any[]
    // Added summary fields derived solely from receipt + decoded transfers
    sender: string
    receiver: string
    amount: string
    token: string // backward compatibility (same as tokenFrom)
    tokenFrom: string
    tokenTo: string
    amountFrom: string
    amountTo: string
    timestamp: Date | null
    status: string | undefined
    gasUsed?: string
    gasPrice?: string
    transactionFeeEth?: number
    nativeTokenSymbol?: string
    // Pricing fields (historical, per token & fee)
    usdtValueFrom?: number
    usdtValueTo?: number
    pricePerTokenFrom?: number
    pricePerTokenTo?: number
    transactionFeeUsd?: number
  } | null> {
    const { hash, chainId, traceRpcUrl, loadTokenMeta } = params
    try {
      // Dynamically import to avoid circular issues
      const { getTxDetails } = await import('./txDetails')

      let network: NetworkConfig | null = null
      if (chainId) {
        network = this.networks.get(chainId.toString()) || null
      }
      if (!network) {
        network = await this.findTransactionNetwork(hash)
      }
      if (!network || !network.client) {
        this.logger.warn(`Unable to resolve network for tx ${hash}`)
        return null
      }

      const result = await getTxDetails({
        hash: hash as `0x${string}`,
        chain: network.chain as Chain,
        publicRpcUrl: network.rpcUrl,
        traceRpcUrl: network.rpcUrl,
        loadTokenMeta,
      })

      // Derive summary fields
      const receipt = result.receipt
      const tx = result.tx
      const nativeTokenInfo = this.getNativeTokenInfo(network.chainId)
      const userAddress = (receipt.from as string)?.toLowerCase()

      let primaryAmount = '0' // amountFrom
      let primaryOutputAmount = '0' // amountTo
      let primarySenderToken = nativeTokenInfo.symbol
      let primaryReceiverToken = nativeTokenInfo.symbol
      const primarySender: string = receipt.from as string
      let primaryReceiver: string = (receipt.to as string) || ''

      // Normalize helper
      const norm = (v: any) => (typeof v === 'string' ? v.toLowerCase() : '')

      // Identify input (user sends) and output (user receives) transfers for swaps
      let inputTransfer: any | undefined
      let outputTransfer: any | undefined

      if (Array.isArray(result.erc20Transfers) && result.erc20Transfers.length) {
        for (const t of result.erc20Transfers) {
          if (!inputTransfer && norm(t.from) === userAddress) {
            inputTransfer = t
          }
          if (norm(t.to) === userAddress) {
            // Keep latest transfer to user as output
            outputTransfer = t
          }
        }
      }

      // If user receives native token internally (e.g. last leg of swap), capture it
      if (!outputTransfer && Array.isArray(result.internalNativeTransfers)) {
        for (const t of result.internalNativeTransfers) {
          if (norm(t.to) === userAddress) {
            outputTransfer = t
          }
        }
      }

      // Helper to select first matching transfer where from == receipt.from for amount fallback
      const pickMatching = (arr: any[]) => arr.find(t => norm(t.from) === userAddress) || arr[0]

      if (result.erc20Transfers.length > 0) {
        const reference = inputTransfer || pickMatching(result.erc20Transfers)
        primaryAmount = reference.valueFormatted
        primarySenderToken = (reference.symbol || nativeTokenInfo.symbol) as string
        // Determine output side
        if (outputTransfer && norm(outputTransfer.to) === userAddress) {
          primaryOutputAmount = outputTransfer.valueFormatted
          primaryReceiverToken = outputTransfer.symbol || primarySenderToken
          primaryReceiver = outputTransfer.to
        } else {
          primaryOutputAmount = reference.valueFormatted
          primaryReceiverToken = reference.symbol || primarySenderToken
          primaryReceiver = (reference.to as string) || (receipt.to as string) || ''
        }
      } else if (result.internalNativeTransfers.length > 0) {
        const reference = pickMatching(result.internalNativeTransfers)
        primaryAmount = reference.valueFormatted
        primaryOutputAmount = reference.valueFormatted
        primarySenderToken = nativeTokenInfo.symbol
        primaryReceiverToken = nativeTokenInfo.symbol
        primaryReceiver = (reference.to as string) || (receipt.to as string) || ''
      } else if (result.erc20Transfers.length === 0 && result.internalNativeTransfers.length === 0) {
        // Fallback: прямой перевод без внутренних/native/erc20 трансферов — берем из самого tx
        try {
          const txValue = (tx?.value as bigint) || 0n
          primaryAmount = formatUnits(txValue, nativeTokenInfo.decimals)
          primaryOutputAmount = primaryAmount
          primarySenderToken = nativeTokenInfo.symbol
          primaryReceiverToken = nativeTokenInfo.symbol
          primaryReceiver = (tx?.to as string) || (receipt.to as string) || ''
        } catch (e) {
          this.logger.warn(`Fallback assignment failed for tx ${hash}: ${(e as Error).message}`)
        }
      }

      // Ensure tokens are set
      if (!primarySenderToken) primarySenderToken = nativeTokenInfo.symbol
      if (!primaryReceiverToken) primaryReceiverToken = primarySenderToken
      if (primaryOutputAmount === '0') primaryOutputAmount = primaryAmount
      // Fetch block timestamp (best-effort)
      let timestamp: Date | null = null
      try {
        if (network.client && receipt.blockNumber) {
          const block = await network.client.getBlock({ blockNumber: receipt.blockNumber })
          timestamp = new Date(Number(block.timestamp) * 1000)
        }
      } catch (e) {
        this.logger.warn(`Failed to fetch block timestamp for ${hash}: ${(e as Error).message}`)
      }
      // Gas / fee metrics
      let gasUsedStr: string | undefined
      let gasPriceStr: string | undefined
      let txFeeEth: number | undefined
      let txFeeUsd: number | undefined
      try {
        const gasUsed: bigint | undefined = receipt.gasUsed
        const effGasPrice: bigint | undefined = (receipt as any).effectiveGasPrice
        if (gasUsed && effGasPrice) {
          gasUsedStr = gasUsed.toString()
          gasPriceStr = formatUnits(effGasPrice, 9) // gwei
          txFeeEth = parseFloat(formatUnits(gasUsed * effGasPrice, 18))
        }
      } catch (e) {
        this.logger.warn(`Failed fee calc for ${hash}: ${(e as Error).message}`)
      }

      // Historical pricing for input/output tokens & fee (best-effort)
      let usdtValueFrom: number | undefined
      let usdtValueTo: number | undefined
      let pricePerTokenFrom: number | undefined
      let pricePerTokenTo: number | undefined

      if (timestamp) {
        // Input side pricing
        try {
          const priceDataFrom = await this.priceService.getHistoricalTokenPriceInUSDT(
            primarySenderToken,
            primaryAmount,
            timestamp
          )
          if (priceDataFrom) {
            usdtValueFrom = priceDataFrom.usdtValue
            pricePerTokenFrom = priceDataFrom.pricePerToken
          }
        } catch (e) {
          this.logger.warn(`Pricing (from) failed for ${primarySenderToken}: ${(e as Error).message}`)
        }

        // Output side pricing (always attempt; if same token can proportionally adjust)
        try {
          if (primaryReceiverToken === primarySenderToken && usdtValueFrom != null) {
            // Adjust proportionally if amount differs
            const amtFromNum = parseFloat(primaryAmount)
            const amtToNum = parseFloat(primaryOutputAmount)
            if (amtFromNum > 0) {
              usdtValueTo = usdtValueFrom * (amtToNum / amtFromNum)
              pricePerTokenTo = pricePerTokenFrom
            } else {
              usdtValueTo = usdtValueFrom
              pricePerTokenTo = pricePerTokenFrom
            }
          } else {
            const priceDataTo = await this.priceService.getHistoricalTokenPriceInUSDT(
              primaryReceiverToken,
              primaryOutputAmount,
              timestamp
            )
            if (priceDataTo) {
              usdtValueTo = priceDataTo.usdtValue
              pricePerTokenTo = priceDataTo.pricePerToken
            }
          }
        } catch (e) {
          this.logger.warn(`Pricing (to) failed for ${primaryReceiverToken}: ${(e as Error).message}`)
        }

        // Fee pricing (native token)
        if (txFeeEth != null) {
          try {
            const feePriceData = await this.priceService.getHistoricalTokenPriceInUSDT(
              nativeTokenInfo.symbol,
              txFeeEth.toString(),
              timestamp
            )
            if (feePriceData) {
              txFeeUsd = feePriceData.usdtValue
            }
          } catch (e) {
            this.logger.warn(`Fee pricing failed for ${nativeTokenInfo.symbol}: ${(e as Error).message}`)
          }
        }
      }

      return {
        networkName: network.name,
        chainId: network.chainId,
        explorerUrl: `${network.explorerBaseUrl}/tx/${hash}`,
        receipt: result.receipt,
        internalNativeTransfers: result.internalNativeTransfers,
        erc20Transfers: result.erc20Transfers,
        sender: primarySender,
        receiver: primaryReceiver,
        amount: primaryAmount,
        token: primarySenderToken,
        tokenFrom: primarySenderToken,
        tokenTo: primaryReceiverToken,
        amountFrom: primaryAmount,
        amountTo: primaryOutputAmount,
        timestamp,
        status: receipt.status,
        gasUsed: gasUsedStr,
        gasPrice: gasPriceStr,
        transactionFeeEth: txFeeEth,
        nativeTokenSymbol: nativeTokenInfo.symbol,
        usdtValueFrom,
        usdtValueTo,
        pricePerTokenFrom,
        pricePerTokenTo,
        transactionFeeUsd: txFeeUsd,
      }
    } catch (e) {
      this.logger.error('getUniversalTxDetails error', e)
      return null
    }
  }
}
