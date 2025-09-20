import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createPublicClient, http, parseAbi, parseAbiItem, formatUnits, PublicClient, decodeEventLog } from 'viem'
import { mainnet, base, baseSepolia, polygon, arbitrum, optimism } from 'viem/chains'
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

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name)
  private publicClient // Legacy single client for compatibility
  private readonly networks: Map<string, NetworkConfig> = new Map()
  private readonly usdtContract: string
  private readonly serviceAddress: string
  private readonly serviceUsdtAddress?: string

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
    switch (chainId) {
      case 1: // Ethereum Mainnet
        return { symbol: 'ETH', decimals: 18 }
      case 8453: // Base Mainnet
        return { symbol: 'ETH', decimals: 18 }
      case 84532: // Base Sepolia
        return { symbol: 'ETH', decimals: 18 }
      case 137: // Polygon Mainnet
        return { symbol: 'MATIC', decimals: 18 }
      case 10: // Optimism Mainnet
        return { symbol: 'ETH', decimals: 18 }
      case 42161: // Arbitrum One
        return { symbol: 'ETH', decimals: 18 }
      default:
        return { symbol: 'ETH', decimals: 18 } // Default fallback
    }
  }

  private async getTokenInfo(contractAddress: string, network: NetworkConfig): Promise<{ symbol: string; decimals: number } | null> {
    if (!network.client) {
      return null
    }

    try {
      // ERC20 ABI for symbol and decimals
      const erc20Abi = parseAbi([
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)'
      ])

      // Get token symbol and decimals
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

      return {
        symbol: symbol as string,
        decimals: Number(decimals)
      }
    } catch (error) {
      this.logger.warn(`Failed to get token info for ${contractAddress}:`, error.message)
      // Fallback to common token addresses
      const address = contractAddress.toLowerCase()
      
      // Common USDT addresses across networks
      if (address === '0xdac17f958d2ee523a2206206994597c13d831ec7' || // Ethereum USDT
          address === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' || // Polygon USDT
          address === '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9') { // Arbitrum USDT
        return { symbol: 'USDT', decimals: 6 }
      }
      
      // Common USDC addresses
      if (address === '0xa0b86a33e6351b8b8b53eebf3c7f65b3e9b5ae8d' || // Base USDC
          address === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' || // Polygon USDC
          address === '0xa0b86a33e6351b8b8b53eebf3c7f65b3e9b5ae8d') { // Ethereum USDC
        return { symbol: 'USDC', decimals: 6 }
      }
      
      return { symbol: 'TOKEN', decimals: 18 } // Default fallback
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
      this.logger.log(`Current block number: ${currentBlock}`)
      const fromBlock = currentBlock - BigInt(5_000)  // Look back fewer blocks for efficiency
      
      this.logger.log(`Checking blocks ${fromBlock} to ${currentBlock} for ETH payment`)

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
                this.logger.log(`ETH payment verified: ${fromAddress} -> ${this.serviceAddress} (${tx.value} wei, expected ${expectedAmountWei} wei)`)
                return true
              }
            }
          }
        } catch (blockError) {
          this.logger.warn(`Error checking block ${blockNum}:`, blockError)
          continue
        }
      }

      this.logger.warn(`ETH payment not found: ${fromAddress} -> ${this.serviceAddress} (${expectedAmount} ETH, ${expectedAmountWei} wei)`)
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

      this.logger.log(`Verifying payment transaction ${paymentTxHash} on ${network.name}`)

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
        this.logger.warn(`Payment transaction ${paymentTxHash} was not successful (status: ${receipt.status})`)
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
        this.logger.log(`ETH payment verified by hash: ${fromAddress} -> ${this.serviceAddress} (${transaction.value} wei, expected ${expectedAmountWei} wei)`)
        return true
      } else {
        this.logger.warn(`Payment verification failed:`, {
          paymentTxHash,
          isCorrectSender,
          isCorrectReceiver,
          isCorrectAmount,
          actualFrom: transaction.from,
          actualTo: transaction.to,
          actualValue: transaction.value.toString(),
          expectedAmount: expectedAmountWei.toString()
        })
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

      this.logger.log(`Verifying ${tokenSymbol} payment transaction ${paymentTxHash} on ${network.name}`)

      // Get the transaction receipt to check logs
      const receipt = await network.client.getTransactionReceipt({
        hash: paymentTxHash as `0x${string}`,
      })

      if (receipt.status !== 'success') {
        this.logger.warn(`Payment transaction ${paymentTxHash} was not successful (status: ${receipt.status})`)
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
                this.logger.log(`${tokenSymbol} payment verified by hash: ${fromAddress} -> ${this.serviceAddress} (${args.value} units, expected ${expectedAmountUnits} units)`)
                return true
              } else {
                this.logger.warn(`${tokenSymbol} payment amount mismatch: received ${args.value}, expected ${expectedAmountUnits}, diff: ${diff}`)
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
          this.logger.log(`USDT payment verified: from ${fromAddress} to ${this.serviceUsdtAddress} value=${value}`)
          return true
        }
      }

      this.logger.warn(`USDT payment not found: from ${fromAddress} to ${this.serviceUsdtAddress} >= ${minAmount} USDT`)
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
      this.logger.log(`🔍 Getting extended transaction details from ${network.name} for ${txHash}`)
      
      const transaction = await network.client.getTransaction({
        hash: txHash as `0x${string}`,
      })

      if (!transaction) {
        this.logger.warn(`❌ Transaction object is null for ${txHash}`)
        return null
      }



      const receipt = await network.client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      })



      const block = await network.client.getBlock({
        blockNumber: transaction.blockNumber,
      })



      const currentBlock = await network.client.getBlockNumber()
      const confirmations = Number(currentBlock - transaction.blockNumber)
      


      // Get basic transaction details using the same network
      const basicDetails = await this.getTransactionDetailsFromNetwork(txHash, network)
      if (!basicDetails) {
        return null
      }
this.logger.warn('receipt', receipt)
this.logger.warn("basicDetails", basicDetails)
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
      this.logger.log(`📊 Getting transaction details from ${network.name} for ${txHash}`)
      
      const transaction = await network.client.getTransaction({
        hash: txHash as `0x${string}`,
      })

      if (!transaction) {
        this.logger.warn(`❌ Transaction is null from ${network.name}`)
        return null
      }

      const receipt = await network.client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      })

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
              
              // Get token info dynamically from contract
              const tokenInfo = await this.getTokenInfo(log.address, network)
              const decimals = tokenInfo?.decimals || 18
              const tokenSymbol = tokenInfo?.symbol || 'TOKEN'

              const amount = formatUnits(args.value, decimals)
              
              // Get USDT conversion
              let usdtValue: number | undefined
              let pricePerToken: number | undefined
              
              try {
                const priceData = await this.priceService.getTokenPriceInUSDT(tokenSymbol, amount)
                if (priceData) {
                  usdtValue = priceData.usdtValue
                  pricePerToken = priceData.pricePerToken
                }
              } catch (error) {
                this.logger.warn(`Failed to get price for ${tokenSymbol}:`, error.message)
              }

              const result = {
                sender: args.from,
                receiver: args.to,
                amount,
                token: tokenSymbol,
                timestamp: new Date(Number(block.timestamp) * 1000),
                blockNumber: Number(transaction.blockNumber),
                chainId: network.chainId,
                explorerUrl: `${network.explorerBaseUrl}/tx/${txHash}`,
                usdtValue,
                pricePerToken,
                status: receipt.status === 'success' ? 'success' as const : receipt.status === 'reverted' ? 'reverted' as const : 'pending' as const
              }
              
              return result
            }
          } catch (decodeError) {
            // Skip logs that can't be decoded as Transfer events
            continue
          }
        }
      }

      // For native token transfers (only if no ERC20 transfers found)
      if (transaction.to && transaction.value > 0) {
        const nativeTokenInfo = this.getNativeTokenInfo(network.chainId)
        const amount = formatUnits(transaction.value, nativeTokenInfo.decimals)
        const token = nativeTokenInfo.symbol
        
        // Get USDT conversion
        let usdtValue: number | undefined
        let pricePerToken: number | undefined
        
        try {
          const priceData = await this.priceService.getTokenPriceInUSDT(token, amount)
          if (priceData) {
            usdtValue = priceData.usdtValue
            pricePerToken = priceData.pricePerToken
          }
        } catch (error) {
          this.logger.warn(`Failed to get price for ${token}:`, error.message)
        }

        const result = {
          sender: transaction.from,
          receiver: transaction.to,
          amount,
          token,
          timestamp: new Date(Number(block.timestamp) * 1000),
          blockNumber: Number(transaction.blockNumber),
          chainId: network.chainId,
          explorerUrl: `${network.explorerBaseUrl}/tx/${txHash}`,
          usdtValue,
          pricePerToken,
          status: receipt.status === 'success' ? 'success' as const : receipt.status === 'reverted' ? 'reverted' as const : 'pending' as const
        }
        
        return result
      }
      
      // If no transfers found, return basic transaction info
      const nativeTokenInfo = this.getNativeTokenInfo(network.chainId)
      const amount = formatUnits(transaction.value, nativeTokenInfo.decimals)
      const token = nativeTokenInfo.symbol
      
      // Get USDT conversion for fallback ETH transaction
      let usdtValue: number | undefined
      let pricePerToken: number | undefined
      
      try {
        const priceData = await this.priceService.getTokenPriceInUSDT(token, amount)
        if (priceData) {
          usdtValue = priceData.usdtValue
          pricePerToken = priceData.pricePerToken
        }
      } catch (error) {
        this.logger.warn(`Failed to get price for ${token}:`, error.message)
      }

      return {
        sender: transaction.from,
        receiver: transaction.to || '0x0000000000000000000000000000000000000000',
        amount,
        token,
        timestamp: new Date(Number(block.timestamp) * 1000),
        blockNumber: Number(transaction.blockNumber),
        chainId: network.chainId,
        explorerUrl: `${network.explorerBaseUrl}/tx/${txHash}`,
        usdtValue,
        pricePerToken,
        status: receipt.status === 'success' ? 'success' : receipt.status === 'reverted' ? 'reverted' : 'pending'
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
    this.logger.log(`Checking transaction ${txHash} across ${this.networks.size} networks`)
    
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
        this.logger.log(`${network.name}: ${exists ? 'FOUND' : 'NOT FOUND'}`)
        
        return { 
          network: network.name, 
          chainId: network.chainId,
          exists, 
          transaction: exists ? transaction : null 
        }
      } catch (error) {
        this.logger.warn(`${network.name} check failed:`, error.message)
        return { network: network.name, chainId: network.chainId, exists: false, error: error.message }
      }
    })

    try {
      // Wait for all network checks to complete
      const results = await Promise.all(checkPromises)
      
      // Log results for debugging
      results.forEach(result => {
        if (result.exists) {
          this.logger.log(`✅ Transaction found in ${result.network} (Chain ID: ${result.chainId})`)
        } else if (result.error) {
          this.logger.warn(`❌ ${result.network}: ${result.error}`)
        }
      })

      // Return true if transaction exists in any network
      const foundNetworks = results.filter(result => result.exists)
      
      if (foundNetworks.length > 0) {
        this.logger.log(`Transaction ${txHash} found in ${foundNetworks.length} network(s): ${foundNetworks.map(n => n.network).join(', ')}`)
        return true
      } else {
        this.logger.warn(`Transaction ${txHash} not found in any supported network`)
        return false
      }
    } catch (error) {
      this.logger.error(`Error during multi-network verification for ${txHash}:`, error)
      return false
    }
  }

  async findTransactionNetwork(txHash: string): Promise<NetworkConfig | null> {
    this.logger.log(`Finding network for transaction ${txHash}`)
    
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
      // Wait for all network checks to complete
      const results = await Promise.all(checkPromises)
      
      // Find the first network where transaction exists
      const foundResult = results.find(result => result.exists)
      
      if (foundResult) {
        this.logger.log(`✅ Transaction ${txHash} found in ${foundResult.network.name} (Chain ID: ${foundResult.network.chainId})`)
        return foundResult.network
      } else {
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
}
