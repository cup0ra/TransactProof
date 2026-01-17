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
  private async delayForNetwork(): Promise<void> {
    const configured = this.configService.get<string>('VERIFICATION_DELAY_MS')
    const delayMs = configured ? 
      Math.min(Math.max(parseInt(configured, 10) || 10000, 0), 60000) : 
      10000
    
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  async payAndGenerate(
    payAndGenerateDto: PayAndGenerateDto,
    userAddress?: string,
    userId?: string,
  ) {
    const { txHash, description, paymentTxHash, paymentAmount, paymentType, paymentContractAddress, companyName, website, logoDataUrl } = payAndGenerateDto

    // Check free generation eligibility for authenticated users
    const { usingFreeGeneration, decrementFreeCounter } = await this.checkFreeGenerationEligibility(userId)

    // Add network delay only if payment verification is needed
    if (!usingFreeGeneration || !decrementFreeCounter) {
      await this.delayForNetwork()
    }

    // 1. Verify transaction exists in supported networks
    const transactionExists = await this.blockchainService.verifyTransactionExists(txHash)
    if (!transactionExists) {
      throw new BadRequestException(
        'Transaction hash not found in any supported network (Ethereum, Base, Base Sepolia, Polygon, Arbitrum, Optimism). Please verify your transaction hash.'
      )
    }

    // 2. Verify payment unless using free generation
    if (userAddress && !usingFreeGeneration) {
      await this.verifyPayment(userAddress, paymentTxHash, paymentAmount, paymentType, paymentContractAddress)
    }
    
    // 3. Decrement free generation counter if applicable
    if (usingFreeGeneration && decrementFreeCounter && userId) {
      await this.prisma.client.user.update({
        where: { id: userId },
        data: { freeGenerationsRemaining: { decrement: 1 } } as any,
      })
    }

    // 4. Fetch transaction details
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

    // 5. Prepare PDF data
    const pdfData = this.preparePdfData(universalDetails, txHash, description)
    
    // 6. Get branding options
    const effectiveBranding = await this.getEffectiveBranding(userId, companyName, website, logoDataUrl)

    // 7. Generate and upload PDF
    const pdfBuffer = await this.pdfService.generateReceiptPdf(pdfData, effectiveBranding)
    const pdfUrl = await this.pdfService.uploadPdf(pdfBuffer, txHash)

    // 8. Save receipt to database
    const receipt = await this.prisma.client.receipt.create({
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
   * Check if user is eligible for free generation
   */
  private async checkFreeGenerationEligibility(userId?: string): Promise<{ usingFreeGeneration: boolean; decrementFreeCounter: boolean }> {
    if (!userId) {
      return { usingFreeGeneration: false, decrementFreeCounter: false }
    }

    const user: any = await this.prisma.client.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return { usingFreeGeneration: false, decrementFreeCounter: false }
    }

    const now = new Date()
    const hasValidDate = user.freeUntil && user.freeUntil > now
    const hasCounter = user.freeGenerationsRemaining && user.freeGenerationsRemaining > 0

    if (hasCounter || hasValidDate) {
      return { 
        usingFreeGeneration: true, 
        decrementFreeCounter: hasCounter 
      }
    }

    return { usingFreeGeneration: false, decrementFreeCounter: false }
  }

  /**
   * Verify payment transaction
   */
  private async verifyPayment(
    userAddress: string,
    paymentTxHash: string | undefined,
    paymentAmount: number | undefined,
    paymentType: string | undefined,
    paymentContractAddress: string | undefined
  ): Promise<void> {
    const expectedPaymentAmount = paymentAmount || 0.0000001
    const paymentTokenType = paymentType || 'ETH'
    let paymentVerified = false
    
    if (paymentTxHash) {
      // Hash-based verification (more efficient)
      if (paymentTokenType === 'ETH') {
        paymentVerified = await this.blockchainService.verifyETHPaymentByHash(
          paymentTxHash,
          userAddress,
          expectedPaymentAmount
        )
      } else if ((paymentTokenType === 'USDT' || paymentTokenType === 'USDC') && paymentContractAddress) {
        paymentVerified = await this.blockchainService.verifyTokenPaymentByHash(
          paymentTxHash,
          userAddress,
          paymentContractAddress,
          expectedPaymentAmount,
          paymentTokenType,
          6
        )
      } else {
        throw new BadRequestException(`Unsupported payment type: ${paymentTokenType}`)
      }
    } else {
      // Fallback to block scanning (less efficient, for backward compatibility)
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
        throw new BadRequestException(`Please provide paymentTxHash for ${paymentTokenType} payments`)
      }
    }
    
    if (!paymentVerified) {
      this.logger.error(`Payment verification failed for ${paymentTokenType}`)
      throw new PaymentRequiredException(
        `Payment of ${expectedPaymentAmount} ${paymentTokenType} to service address not found. Please complete payment first.`
      )
    }
  }

  /**
   * Prepare PDF data from universal transaction details
   */
  private preparePdfData(universalDetails: any, txHash: string, description?: string): any {
    return {
      txHash,
      sender: universalDetails.sender,
      receiver: universalDetails.receiver,
      amount: universalDetails.amountFrom || universalDetails.amount,
      token: universalDetails.tokenFrom || universalDetails.token,
      tokenFrom: universalDetails.tokenFrom,
      tokenTo: universalDetails.tokenTo,
      amountFrom: universalDetails.amountFrom || universalDetails.amount,
      amountTo: universalDetails.amountTo || universalDetails.amount,
      timestamp: universalDetails.timestamp || new Date(),
      description,
      chainId: universalDetails.chainId,
      explorerUrl: universalDetails.explorerUrl,
      usdtValue: universalDetails.usdtValueFrom,
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
  }

  /**
   * Get effective branding (from request or stored user branding)
   */
  private async getEffectiveBranding(
    userId: string | undefined,
    companyName: string | undefined,
    website: string | undefined,
    logoDataUrl: string | undefined
  ): Promise<BrandingOptions | undefined> {
    // Use provided branding if available
    if (companyName || website || logoDataUrl) {
      return {
        companyName: companyName?.trim() || undefined,
        website: website?.trim() || undefined,
        logoDataUrl: logoDataUrl,
      }
    }

    // Load stored branding for authenticated users
    if (userId) {
      try {
        const stored = await this.brandingService.getUserBranding(userId)
        if (stored) {
          return {
            companyName: stored.companyName || undefined,
            website: stored.website || undefined,
            logoDataUrl: stored.logoDataUrl || undefined,
            showErc20Transfers: stored.showErc20Transfers === true,
          }
        }
      } catch (e) {
        this.logger.warn('Failed to load stored branding', { userId })
      }
    }

    return undefined
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

    // Validate payment parameters
    this.validatePaymentParams(paymentTxHash, paymentContractAddress, paymentType, ['USDT', 'USDC'])

    const PACK_GENERATIONS = parseInt(this.configService.get<string>('PACK_GENERATIONS') || '20', 10)
    const expectedAmount = paymentAmount ?? 9.99

    await this.delayForNetwork()

    // Verify payment
    const verified = await this.blockchainService.verifyTokenPaymentByHash(
      paymentTxHash,
      userAddress,
      paymentContractAddress!,
      expectedAmount,
      paymentType,
      6
    )

    if (!verified) {
      throw new PaymentRequiredException(`Payment of ${expectedAmount} ${paymentType} not verified`)
    }

    // Increment user's free generations
    const updatedUser = await this.prisma.client.user.update({
      where: { id: userId },
      data: { freeGenerationsRemaining: { increment: PACK_GENERATIONS } } as any,
    })

    return {
      ok: true,
      added: PACK_GENERATIONS,
      freeGenerationsRemaining: (updatedUser as any).freeGenerationsRemaining,
      paymentTxHash,
      paymentAmount: expectedAmount,
      paymentType,
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

    // Validate payment parameters
    this.validatePaymentParams(paymentTxHash, paymentContractAddress, paymentType, ['USDT', 'USDC'])

    const expectedAmount = paymentAmount ?? 29.99

    await this.delayForNetwork()
    
    const verified = await this.blockchainService.verifyTokenPaymentByHash(
      paymentTxHash,
      userAddress,
      paymentContractAddress!,
      expectedAmount,
      paymentType,
      6
    )
    
    if (!verified) {
      throw new PaymentRequiredException(`Payment of ${expectedAmount} ${paymentType} not verified`)
    }

    // Update subscription: extend freeUntil 30 days from now and add 500 generations
    const now = new Date()
    const newUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const updated = await this.prisma.client.user.update({
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

  /**
   * Validate payment parameters
   */
  private validatePaymentParams(
    paymentTxHash: string | undefined,
    paymentContractAddress: string | undefined,
    paymentType: string,
    allowedTokens: string[]
  ): void {
    if (!paymentTxHash || paymentTxHash.length !== 66) {
      throw new BadRequestException('Invalid payment transaction hash')
    }
    if (!paymentContractAddress || !paymentContractAddress.startsWith('0x')) {
      throw new BadRequestException('Invalid token contract address')
    }
    if (!allowedTokens.includes(paymentType)) {
      throw new BadRequestException(`Unsupported payment token: ${paymentType}`)
    }
  }

  async getUserReceipts(userId: string, chainId?: number, page?: number, limit?: number) {
    const whereClause: any = { userId }
    
    if (chainId) {
      whereClause.chainId = chainId
    }
    
    const queryOptions: any = {
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    }
    
    // Apply pagination if requested
    if (page && limit) {
      queryOptions.skip = (page - 1) * limit
      queryOptions.take = limit
    }
    
    const [receipts, total] = await Promise.all([
      this.prisma.client.receipt.findMany(queryOptions),
      this.prisma.client.receipt.count({ where: whereClause })
    ])

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
    
    // Include pagination metadata if requested
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
    const receipt = await this.prisma.client.receipt.findUnique({
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
      this.logger.warn(`Failed to get transaction details for ${receipt.txHash}`)
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
      transactionDetails,
    }
  }

  async verifyTransaction(txHash: string) {
    try {
      const exists = await this.blockchainService.verifyTransactionExists(txHash)
      
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
      const details = await this.blockchainService.getExtendedTransactionDetails(txHash)
      
      if (!details) {
        throw new NotFoundException('Transaction not found')
      }

      return details
    } catch (error) {
      this.logger.error(`Error getting transaction details for ${txHash}:`, error)
      throw new BadRequestException('Failed to get transaction details')
    }
  }

  async downloadPdf(id: string, userId?: string) {
    const receipt = await this.getReceipt(id, userId)
    return { pdfUrl: receipt.pdfUrl }
  }
}
