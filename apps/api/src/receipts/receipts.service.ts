import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  ForbiddenException,
  Logger
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../database/prisma.service'
import { BlockchainService } from './blockchain.service'
import { PdfService, BrandingOptions } from './pdf.service'
import { BrandingService } from './services/branding.service'
import { PayAndGenerateDto } from './dto/pay-and-generate.dto'
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception'
import { PurchasePackDto } from './dto/purchase-pack.dto'
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto'

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly pdfService: PdfService,
    private readonly configService: ConfigService,
    private readonly brandingService: BrandingService,
  ) {}

  /**
   * Introduce a short delay to allow freshly submitted blockchain transactions
   * to propagate before we attempt to verify them. Default 10s, configurable
   * via env VERIFICATION_DELAY_MS.
   */
  private async delayForNetwork() {
    const configured = this.configService.get<string>('VERIFICATION_DELAY_MS')
    let delayMs = 10000 // default 10 seconds
    if (configured) {
      const parsed = parseInt(configured, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 60000) { // clamp to 60s max safety
        delayMs = parsed
      }
    }
    if (delayMs > 0) {
      this.logger.log(`Waiting ${delayMs}ms before verification to allow transaction propagation...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  async payAndGenerate(
    payAndGenerateDto: PayAndGenerateDto,
    userAddress?: string,
    userId?: string,
  ) {
  const { txHash, description, paymentTxHash, paymentAmount, paymentType, paymentContractAddress, companyName, website, logoDataUrl } = payAndGenerateDto

    // If user is authenticated, fetch free generation status
  let usingFreeGeneration = false
  let decrementFreeCounter = false
    if (userId) {
      const user: any = await this.prisma.user.findUnique({
        where: { id: userId },
      })
      if (user) {
        const now = new Date()
        const dateValid = user.freeUntil && user.freeUntil > now
        const hasCounter = user.freeGenerationsRemaining && user.freeGenerationsRemaining > 0
        if (hasCounter || dateValid) {
          usingFreeGeneration = true
          // Only decrement if we actually consumed from counter
            if (hasCounter) {
              decrementFreeCounter = true
            }
        }
      }
    }

    if (!usingFreeGeneration || !decrementFreeCounter) {
      await this.delayForNetwork()
    }

    // 1. Verify transaction exists in supported networks before processing payment
    this.logger.log(`Verifying transaction ${txHash} exists in supported networks...`)
    const transactionExists = await this.blockchainService.verifyTransactionExists(txHash)
    
    if (!transactionExists) {
      throw new BadRequestException(
        'Transaction hash not found in any supported network (Ethereum, Base, Base Sepolia, Polygon, Arbitrum, Optimism). Please verify your transaction hash.'
      )
    }

    this.logger.log(`Transaction ${txHash} verified - found in supported networks`)

    // 2. Verify payment unless using free generation
    if (userAddress && !usingFreeGeneration) {
      const expectedPaymentAmount = paymentAmount || 0.0000001 // Default fallback
      const paymentTokenType = paymentType || 'ETH' // Default to ETH
      let paymentVerified = false
      
      if (paymentTxHash) {
        // Use efficient hash-based verification if payment hash is provided
        this.logger.log(`Verifying ${paymentTokenType} payment using transaction hash: ${paymentTxHash} for amount: ${expectedPaymentAmount}`)
        
        if (paymentTokenType === 'ETH') {
          paymentVerified = await this.blockchainService.verifyETHPaymentByHash(
            paymentTxHash,
            userAddress,
            expectedPaymentAmount
          )
        } else if ((paymentTokenType === 'USDT' || paymentTokenType === 'USDC') && paymentContractAddress) {
          // For token payments, use the new token verification method
          paymentVerified = await this.blockchainService.verifyTokenPaymentByHash(
            paymentTxHash,
            userAddress,
            paymentContractAddress,
            expectedPaymentAmount,
            paymentTokenType,
            6 // USDT/USDC typically have 6 decimals
          )
        } else {
          this.logger.error(`Unsupported payment type: ${paymentTokenType} or missing contract address`)
          throw new BadRequestException(`Unsupported payment type: ${paymentTokenType}`)
        }
      } else {
        // Fallback to old method if no payment hash provided (for backward compatibility)
        this.logger.log(`Using fallback payment verification method for ${paymentTokenType}: ${expectedPaymentAmount}`)
        
        if (paymentTokenType === 'ETH') {
          paymentVerified = await this.blockchainService.verifyETHPayment(
            userAddress,
            expectedPaymentAmount,
          )
        } else if (paymentTokenType === 'USDT') {
          paymentVerified = await this.blockchainService.verifyUSDTPayment(
            userAddress,
            expectedPaymentAmount,
          )
        } else {
          this.logger.error(`Fallback verification not supported for payment type: ${paymentTokenType}`)
          throw new BadRequestException(`Please provide paymentTxHash for ${paymentTokenType} payments`)
        }
      }
      
      if (!paymentVerified) {
        this.logger.error(`Payment verification failed:`, {
          paymentTxHash,
          paymentTokenType,
          expectedPaymentAmount,
          userAddress,
          paymentContractAddress
        })
        throw new PaymentRequiredException(
          `Payment of ${expectedPaymentAmount} ${paymentTokenType} to service address not found. Please complete payment first.`
        )
      }
    }
    
    // Decrement free generation if used
    if (usingFreeGeneration && decrementFreeCounter && userId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { freeGenerationsRemaining: { decrement: 1 } } as any,
      })
      this.logger.log(`Using free generation (counter) for user ${userId}. Remaining decremented.`)
    } else if (usingFreeGeneration) {
      this.logger.log(`Using date-based free generation for user ${userId}. Counter not decremented.`)
    }

    // 3. Use ONLY universal details (getUniversalTxDetails) for PDF generation
    this.logger.log(`Fetching universal transaction details (single source) for ${txHash}`)
    const networkForTx = await this.blockchainService.findTransactionNetwork(txHash)
    const universalDetails = await this.blockchainService.getUniversalTxDetails({
      hash: txHash,
      chainId: networkForTx?.chainId,
      traceRpcUrl: this.configService.get<string>('TRACE_RPC_URL') || undefined,
      loadTokenMeta: true,
    })
    if (!universalDetails) {
      throw new BadRequestException('Universal transaction details not found or invalid')
    }

    // 4. Generate PDF using universalDetails summary fields
    const pdfData: any = {
      txHash,
      sender: universalDetails.sender,
      receiver: universalDetails.receiver,
      amount: universalDetails.amountFrom || universalDetails.amount,
      token: universalDetails.tokenFrom || universalDetails.token,
      // extended universal swap fields
      tokenFrom: universalDetails.tokenFrom,
      tokenTo: universalDetails.tokenTo,
      amountFrom: universalDetails.amountFrom || universalDetails.amount,
      amountTo: universalDetails.amountTo || universalDetails.amount,
      timestamp: universalDetails.timestamp || new Date(),
      description,
      chainId: universalDetails.chainId,
      explorerUrl: universalDetails.explorerUrl,
      // Historical pricing (now provided by universalDetails best-effort)
      usdtValue: universalDetails.usdtValueFrom, // backward compatibility (input side)
      pricePerToken: universalDetails.pricePerTokenFrom,
      usdtValueFrom: universalDetails.usdtValueFrom,
      usdtValueTo: universalDetails.usdtValueTo,
      pricePerTokenFrom: universalDetails.pricePerTokenFrom,
      pricePerTokenTo: universalDetails.pricePerTokenTo,
      status: universalDetails.status,
      gasUsed: universalDetails.gasUsed,
      gasPrice: universalDetails.gasPrice,
      transactionFeeEth: universalDetails.transactionFeeEth,
      transactionFeeUsd: universalDetails.transactionFeeUsd,
      nativeTokenSymbol: universalDetails.nativeTokenSymbol,
      internalNativeTransfers: universalDetails.internalNativeTransfers,
      erc20Transfers: universalDetails.erc20Transfers,
    }
    // Swap leg extraction removed — using only universal details per requirement.
    
    const branding: BrandingOptions | undefined = (companyName || website || logoDataUrl) ? {
      companyName: companyName?.trim() || undefined,
      website: website?.trim() || undefined,
      logoDataUrl: logoDataUrl, // Already validated in DTO
    } : undefined

    let effectiveBranding: BrandingOptions | undefined = branding
    if (!effectiveBranding && userId) {
      try {
        const stored = await this.brandingService.getUserBranding(userId)
        if (stored) {
          effectiveBranding = {
            companyName: stored.companyName || undefined,
            website: stored.website || undefined,
            logoDataUrl: stored.logoDataUrl || undefined,
            showErc20Transfers: stored.showErc20Transfers === true,
          }
        }
      } catch (e) {
        this.logger.warn('Failed to load stored branding', { userId, error: (e as Error).message })
      }
    }

    const pdfBuffer = await this.pdfService.generateReceiptPdf(pdfData, effectiveBranding)

    // 5. Upload PDF to storage
    const pdfUrl = await this.pdfService.uploadPdf(pdfBuffer, txHash)

    // 6. Save receipt to database
    const receipt = await this.prisma.receipt.create({
      data: {
        userId,
        txHash,
        sender: pdfData.sender,
        receiver: pdfData.receiver,
        amount: parseFloat(pdfData.amount),
        token: pdfData.token,
        chainId: pdfData.chainId,
        pdfUrl,
        description,
      },
    })

    return {
      id: receipt.id,
      txHash: receipt.txHash,
      sender: receipt.sender,
      receiver: receipt.receiver,
      amount: receipt.amount.toString(),
      token: receipt.token,
      chainId: receipt.chainId,
      pdfUrl: receipt.pdfUrl,
      description: receipt.description,
      createdAt: receipt.createdAt.toISOString(),
    }
  }

  /**
   * Purchase a generations pack (e.g., 20 generations for fixed price) by verifying
   * a token payment transaction hash (USDT / USDC). On success increments user's
   * freeGenerationsRemaining counter.
   */
  async purchasePack(purchasePackDto: PurchasePackDto, userAddress?: string, userId?: string) {
    const { paymentTxHash, paymentAmount, paymentType, paymentContractAddress } = purchasePackDto

    if (!userAddress || !userId) {
      throw new ForbiddenException('User not authenticated')
    }

    const PACK_GENERATIONS = this.configService.get<number>('PACK_GENERATIONS') ? parseInt(this.configService.get<string>('PACK_GENERATIONS')!, 10) : 20
    const expectedAmount = paymentAmount ?? 9.99
    const tokenSymbol = paymentType
    const decimals = 6 // Stablecoins

    // Basic validation
    if (!paymentTxHash || paymentTxHash.length !== 66) {
      throw new BadRequestException('Invalid payment transaction hash')
    }
    if (!paymentContractAddress || !paymentContractAddress.startsWith('0x')) {
      throw new BadRequestException('Invalid token contract address')
    }
    if (!['USDT', 'USDC'].includes(tokenSymbol)) {
      throw new BadRequestException('Unsupported payment token')
    }

    // Allow propagation delay (re-use logic)
    await this.delayForNetwork()

    // Verify payment via hash
    let verified = false
    try {
      verified = await this.blockchainService.verifyTokenPaymentByHash(
        paymentTxHash,
        userAddress,
        paymentContractAddress,
        expectedAmount,
        tokenSymbol,
        decimals
      )
    } catch (e) {
      this.logger.error('Error verifying pack payment', e)
    }

    if (!verified) {
      throw new PaymentRequiredException(`Payment of ${expectedAmount} ${tokenSymbol} not verified`)
    }

    // Increment user's free generations
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { freeGenerationsRemaining: { increment: PACK_GENERATIONS } } as any,
    })

    this.logger.log(`Pack purchased: +${PACK_GENERATIONS} generations for user ${userId}`)

    return {
      ok: true,
      added: PACK_GENERATIONS,
  freeGenerationsRemaining: (updatedUser as any).freeGenerationsRemaining,
      paymentTxHash,
      paymentAmount: expectedAmount,
      paymentType: tokenSymbol,
    }
  }

  /**
   * Purchase monthly subscription: verifies payment and sets freeUntil + extends counter.
   */
  async purchaseSubscription(dto: PurchaseSubscriptionDto, userAddress?: string, userId?: string) {
    const { paymentTxHash, paymentAmount, paymentType, paymentContractAddress } = dto
    if (!userAddress || !userId) {
      throw new ForbiddenException('User not authenticated')
    }
    if (!paymentTxHash || paymentTxHash.length !== 66) {
      throw new BadRequestException('Invalid payment transaction hash')
    }
    if (!['USDT','USDC'].includes(paymentType)) {
      throw new BadRequestException('Unsupported token')
    }
    if (!paymentContractAddress) {
      throw new BadRequestException('Missing contract address')
    }

    const expectedAmount = paymentAmount ?? 29.99
    const decimals = 6

    await this.delayForNetwork()
    const verified = await this.blockchainService.verifyTokenPaymentByHash(
      paymentTxHash,
      userAddress,
      paymentContractAddress,
      expectedAmount,
      paymentType,
      decimals
    )
    if (!verified) {
      throw new PaymentRequiredException(`Payment of ${expectedAmount} ${paymentType} not verified`)
    }

    // Update subscription: extend freeUntil 30 days from now and ensure counter at least 500
    const now = new Date()
    const newUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        freeUntil: newUntil,
        freeGenerationsRemaining: { increment: 500 },
      } as any,
    })

    return {
      ok: true,
      type: 'subscription',
      freeUntil: newUntil.toISOString(),
      freeGenerationsRemaining: (updated as any).freeGenerationsRemaining,
      paymentTxHash,
      paymentAmount: expectedAmount,
      paymentType,
    }
  }

  async getUserReceipts(userId: string, chainId?: number, page?: number, limit?: number) {
    const whereClause: any = { userId }
    
    // Add chainId filter if provided
    if (chainId) {
      whereClause.chainId = chainId
    }
    
    // If pagination is requested, apply it; otherwise return all
    const queryOptions: any = {
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    }
    
    if (page && limit) {
      const skip = (page - 1) * limit
      queryOptions.skip = skip
      queryOptions.take = limit
    }
    
    const receipts = await this.prisma.receipt.findMany(queryOptions)
    const total = await this.prisma.receipt.count({ where: whereClause })

    const response: any = {
      receipts: receipts.map(receipt => ({
        id: receipt.id,
        txHash: receipt.txHash,
        sender: receipt.sender,
        receiver: receipt.receiver,
        amount: receipt.amount.toString(),
        token: receipt.token,
        chainId: receipt.chainId,
        pdfUrl: receipt.pdfUrl,
        description: receipt.description,
        createdAt: receipt.createdAt.toISOString(),
      })),
    }
    
    // Only include pagination if it was requested
    if (page && limit) {
      response.pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    } else {
      response.total = total
    }

    return response
  }

  async getReceipt(id: string, userId?: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
    })

    if (!receipt) {
      throw new NotFoundException('Receipt not found')
    }

    // Check access permissions
    if (receipt.userId && userId && receipt.userId !== userId) {
      throw new ForbiddenException('Access denied')
    }

    // Get extended transaction details
    let transactionDetails = null
    try {
      transactionDetails = await this.blockchainService.getExtendedTransactionDetails(receipt.txHash)
    } catch (error) {
      this.logger.warn(`Failed to get extended transaction details for ${receipt.txHash}:`, error)
    }

    return {
      id: receipt.id,
      txHash: receipt.txHash,
      sender: receipt.sender,
      receiver: receipt.receiver,
      amount: receipt.amount.toString(),
      token: receipt.token,
      chainId: receipt.chainId,
      pdfUrl: receipt.pdfUrl,
      description: receipt.description,
      createdAt: receipt.createdAt.toISOString(),
      transactionDetails, // Include extended details
    }
  }

  async verifyTransaction(txHash: string) {
    try {
      this.logger.log(`Verifying transaction ${txHash} across all supported networks...`)
      const exists = await this.blockchainService.verifyTransactionExists(txHash)
      
      this.logger.log(`Transaction ${txHash} verification result: ${exists ? 'FOUND' : 'NOT FOUND'}`)
      
      return {
        exists,
        txHash,
        message: exists ? 
          'Transaction found in supported networks' : 
          'Transaction not found in any supported network (Ethereum, Base, Base Sepolia, Polygon, Arbitrum, Optimism)'
      }
    } catch (error) {
      this.logger.error(`Error verifying transaction ${txHash}:`, error)
      return {
        exists: false,
        txHash
      }
    }
  }

  async getTransactionDetails(txHash: string) {
    try {
      this.logger.log(`📋 Getting transaction details for hash: ${txHash}`)
      
      const details = await this.blockchainService.getExtendedTransactionDetails(txHash)
      
      if (!details) {
        this.logger.warn(`❌ Transaction not found: ${txHash}`)
        throw new NotFoundException('Transaction not found')
      }


      this.logger.log(`✅ Transaction details retrieved successfully for ${txHash}`)
      
      return details
    } catch (error) {
      this.logger.error(`❌ Error getting transaction details for ${txHash}:`, error)
      throw new BadRequestException('Failed to get transaction details')
    }
  }

  async downloadPdf(id: string, userId?: string) {
    const receipt = await this.getReceipt(id, userId)
    
    // Return redirect to PDF URL or stream the file
    return { pdfUrl: receipt.pdfUrl }
  }
}
