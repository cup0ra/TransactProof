import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  ForbiddenException,
  Logger
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../database/prisma.service'
import { BlockchainService, ExtendedTransactionDetails } from './blockchain.service'
import { PdfService } from './pdf.service'
import { PayAndGenerateDto } from './dto/pay-and-generate.dto'
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception'

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly pdfService: PdfService,
    private readonly configService: ConfigService,
  ) {}

  async payAndGenerate(
    payAndGenerateDto: PayAndGenerateDto,
    userAddress?: string,
    userId?: string,
  ) {
    const { txHash, description, paymentTxHash, paymentAmount, paymentType, paymentContractAddress } = payAndGenerateDto

    // 1. Verify transaction exists in supported networks before processing payment
    this.logger.log(`Verifying transaction ${txHash} exists in supported networks...`)
    const transactionExists = await this.blockchainService.verifyTransactionExists(txHash)
    
    if (!transactionExists) {
      throw new BadRequestException(
        'Transaction hash not found in any supported network (Ethereum, Base, Base Sepolia, Polygon, Arbitrum, Optimism). Please verify your transaction hash.'
      )
    }

    this.logger.log(`Transaction ${txHash} verified - found in supported networks`)

    // 2. Verify payment (dynamic amount and type from UI, fallback to ETH)
    if (userAddress) {
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
        throw new PaymentRequiredException(
          `Payment of ${expectedPaymentAmount} ${paymentTokenType} to service address not found. Please complete payment first.`
        )
      }
    }

    // 3. Get real transaction details from blockchain
    const txDetails = await this.blockchainService.getTransactionDetails(txHash)
    
    if (!txDetails) {
      throw new BadRequestException('Transaction not found or invalid')
    }

    this.logger.log(`Retrieved transaction details for ${txHash}:`, {
      sender: txDetails.sender,
      receiver: txDetails.receiver,
      amount: txDetails.amount,
      token: txDetails.token,
      status: txDetails.status,
      usdtValue: txDetails.usdtValue
    })

    // 4. Generate PDF with real blockchain data
    const pdfData = {
      txHash,
      sender: txDetails.sender,
      receiver: txDetails.receiver,
      amount: txDetails.amount,
      token: txDetails.token,
      timestamp: txDetails.timestamp,
      description,
      chainId: txDetails.chainId,
      explorerUrl: txDetails.explorerUrl,
      usdtValue: txDetails.usdtValue,
      pricePerToken: txDetails.pricePerToken,
      status: txDetails.status,
    }
    
    const pdfBuffer = await this.pdfService.generateReceiptPdf(pdfData)

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

  async getUserReceipts(userId: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit
    
    const receipts = await this.prisma.receipt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await this.prisma.receipt.count({
      where: { userId },
    })

    return {
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
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
