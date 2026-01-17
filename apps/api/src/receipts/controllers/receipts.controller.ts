import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Req, 
  Res,
  UseGuards, 
  Query 
} from '@nestjs/common'
import { Request, Response } from 'express'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ThrottlerGuard } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ReceiptsService } from '../services/receipts.service'
import { BrandingService } from './services/branding.service'
import { PayAndGenerateDto } from './dto/pay-and-generate.dto'
import { ReceiptResponseDto } from './dto/receipt-response.dto'
import { PurchasePackDto } from './dto/purchase-pack.dto'
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto'
import * as fs from 'fs'
import { resolveUploadsDir, buildUploadFilePath } from '../common/utils/uploads-path.util'

@ApiTags('receipts')
@Controller('receipts')
export class ReceiptsController {
  constructor(
    private readonly receiptsService: ReceiptsService,
    private readonly brandingService: BrandingService,
  ) {}

  @Post('pay-and-generate')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Pay 1 USDT and generate PDF receipt',
    description: 'Verifies USDT payment and generates a PDF receipt for the specified transaction hash'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Receipt generated successfully',
    type: ReceiptResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid transaction hash or payment not found' })
  @ApiResponse({ status: 402, description: 'Payment required - 1 USDT not received' })
  async payAndGenerate(
    @Body() payAndGenerateDto: PayAndGenerateDto,
    @Req() req: Request,
  ) {
    const userAddress = req.user?.walletAddress
    const userId = req.user?.id
    
    return this.receiptsService.payAndGenerate(
      payAndGenerateDto,
      userAddress,
      userId,
    )
  }

  @Post('purchase-pack')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase generations pack (USDT/USDC)' })
  @ApiResponse({ status: 201, description: 'Pack purchased, generations added' })
  @ApiResponse({ status: 400, description: 'Invalid data or payment not verified' })
  async purchasePack(
    @Body() purchasePackDto: PurchasePackDto,
    @Req() req: Request,
  ) {
    const userAddress = req.user?.walletAddress
    const userId = req.user?.id
    return this.receiptsService.purchasePack(purchasePackDto, userAddress, userId)
  }

  @Post('purchase-subscription')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase monthly subscription (USDT/USDC)' })
  @ApiResponse({ status: 201, description: 'Subscription activated' })
  async purchaseSubscription(
    @Body() dto: PurchaseSubscriptionDto,
    @Req() req: Request,
  ) {
    return this.receiptsService.purchaseSubscription(dto, req.user?.walletAddress, req.user?.id)
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user receipts' })
  @ApiResponse({ 
    status: 200, 
    description: 'User receipts retrieved successfully',
    type: [ReceiptResponseDto]
  })
  async getMyReceipts(
    @Req() req: Request,
    @Query('chainId') chainId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id
    const chainIdNum = chainId ? parseInt(chainId, 10) : undefined
    const pageNum = page ? parseInt(page, 10) : undefined
    const limitNum = limit ? parseInt(limit, 10) : undefined
    
    return this.receiptsService.getUserReceipts(userId, chainIdNum, pageNum, limitNum)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Receipt retrieved successfully',
    type: ReceiptResponseDto
  })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async getReceipt(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id
    return this.receiptsService.getReceipt(id, userId)
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download receipt PDF' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async downloadPdf(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id
    return this.receiptsService.downloadPdf(id, userId)
  }

  @Get('verify-transaction/:txHash')
  @ApiOperation({ summary: 'Verify if transaction hash exists on blockchain' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction verification result',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean' },
        txHash: { type: 'string' }
      }
    }
  })
  async verifyTransaction(
    @Param('txHash') txHash: string,
  ) {
    return this.receiptsService.verifyTransaction(txHash)
  }

  @Get('transaction/:txHash')
  @ApiOperation({ summary: 'Get extended transaction details by hash' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction details retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionDetails(
    @Param('txHash') txHash: string,
  ) {
    return this.receiptsService.getTransactionDetails(txHash)
  }

  @Get('files/:filename')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Serve PDF files' })
  @ApiResponse({ status: 200, description: 'PDF file served' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async serveFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const uploadsDir = resolveUploadsDir()
      const filePath = buildUploadFilePath(filename)
      const user = (res.req as any)?.user
      const logMeta = {
        filename,
        uploadsDir,
        filePath,
        cwd: process.cwd(),
        user: user ? { id: user.id, wallet: user.walletAddress } : null,
      }

      if (!fs.existsSync(filePath)) {
        console.warn('[serveFile] File not found', logMeta)
        return res.status(404).json({ message: 'File not found' })
      }

      if (!filename.startsWith('receipt-') || !filename.endsWith('.pdf')) {
        console.warn('[serveFile] Access denied (invalid pattern)', logMeta)
        return res.status(403).json({ message: 'Access denied' })
      }

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      console.log('[serveFile] Streaming file', logMeta)
      fs.createReadStream(filePath).pipe(res)
    } catch (error) {
      console.error('[serveFile] Internal error', { filename, error: (error as Error).message })
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // Branding: get current user's stored branding
  @Get('my/branding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stored branding preferences for current user' })
  async getBranding(@Req() req: Request) {
    const userId = req.user?.id
    if (!userId) return { branding: null }
    const branding = await this.brandingService.getUserBranding(userId)
    return { branding }
  }

  // Branding: upsert current user's branding
  @Post('my/branding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save (upsert) branding preferences for current user' })
  async upsertBranding(
    @Req() req: Request,
    @Body() body: { companyName?: string; website?: string; logoDataUrl?: string; showErc20Transfers?: boolean },
  ) {
    const userId = req.user?.id
    if (!userId) return { ok: false, message: 'Unauthorized' }
    // Basic server-side size/type guard (mirrors DTO logic but simpler since endpoint is dedicated)
    if (body.logoDataUrl) {
      const ok = /^data:image\/(png|jpe?g|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(body.logoDataUrl)
      if (!ok) return { ok: false, message: 'Invalid logoDataUrl format' }
      const b64 = body.logoDataUrl.split(',')[1]
      if (b64) {
        const bytes = (b64.length * 3) / 4 - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0)
        if (bytes > 500 * 1024) return { ok: false, message: 'Logo exceeds 500KB limit' }
      }
    }
    const branding = await this.brandingService.upsertUserBranding(userId, body)
    return { ok: true, branding }
  }
}
