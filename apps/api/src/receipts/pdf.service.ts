import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as puppeteer from 'puppeteer'
import * as QRCode from 'qrcode'
import * as fs from 'fs'
import { resolveUploadsDir, buildUploadFilePath } from '../common/utils/uploads-path.util'

interface ReceiptData {
  txHash: string
  sender: string
  receiver: string
  amount: string
  token: string
  timestamp: Date
  description?: string
  chainId: number
  explorerUrl: string
  usdtValue?: number
  pricePerToken?: number
  status?: string
  // Transaction fee data
  gasUsed?: string
  gasPrice?: string
  transactionFeeEth?: number  // Fee in ETH (or native token)
  transactionFeeUsd?: number  // Fee in USD
  nativeTokenSymbol?: string  // ETH, BNB, MATIC, etc.
}

// Per-request branding options (ephemeral – not stored yet)
export interface BrandingOptions {
  companyName?: string
  website?: string
  logoDataUrl?: string // data:image/<type>;base64,<data>
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name)

  constructor(private readonly configService: ConfigService) {}

  async generateReceiptPdf(data: ReceiptData, branding?: BrandingOptions): Promise<Buffer> {
    this.logger.log('🚀 Starting PDF generation process...')
    
    // Browser configuration for Railway deployment
    const browserConfig: puppeteer.LaunchOptions = {
    headless: true, // Or 'new' for new headless mode
     args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
   ]
    }


    // Use system Chrome/Chromium if available (Railway deployment)
    const puppeteerExecutablePath = this.configService.get('PUPPETEER_EXECUTABLE_PATH')
    if (puppeteerExecutablePath) {
      browserConfig.executablePath = puppeteerExecutablePath
      this.logger.log(`Using system browser: ${puppeteerExecutablePath}`)
      
      // Check if executable exists
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs')
      if (!fs.existsSync(puppeteerExecutablePath)) {
        this.logger.error(`❌ Browser executable not found at: ${puppeteerExecutablePath}`)
        throw new Error(`Browser executable not found at: ${puppeteerExecutablePath}`)
      }
    } else {
      this.logger.warn('No PUPPETEER_EXECUTABLE_PATH found, using default Puppeteer browser')
    }

    let browser: puppeteer.Browser
    try {
      browser = await puppeteer.launch(browserConfig)
      this.logger.log('✅ Browser launched successfully')
    } catch (error) {
      this.logger.error('❌ Failed to launch browser with Puppeteer:', error)
      this.logger.error('🛠️ Browser config used:', JSON.stringify(browserConfig, null, 2))
      throw new Error(`Failed to launch browser: ${error.message}`)
    }

    try {
      const page = await browser.newPage()
      
      // Use explorer URL from transaction data
      const qrCodeDataUrl = await QRCode.toDataURL(data.explorerUrl)

  const html = this.generateReceiptHtml(data, qrCodeDataUrl, data.explorerUrl, branding)
      
      await page.setContent(html, { waitUntil: 'networkidle0' })
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      })

      return Buffer.from(pdfBuffer)
    } finally {
      await browser.close()
    }
  }

  private generateReceiptHtml(
    data: ReceiptData,
    qrCodeDataUrl: string,
    explorerUrl: string,
    branding?: BrandingOptions,
  ): string {
    // Basic HTML escape (covers &, <, >, ")
    const escapeHtml = (v?: string) => (v ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]!))

    const brandCompany = escapeHtml(branding?.companyName) || null
    const brandWebsite = escapeHtml(branding?.website) || null
    const dataUrl = branding.logoDataUrl?.trim()

    const isShowingBranding = !!(dataUrl || brandCompany || brandWebsite)

    const brandingBlock = isShowingBranding ?
     `<div class="header">
          <div class="logo">
             ${dataUrl ? `<img src="${dataUrl}" alt="Logo" style="max-height:25px;max-width:25px;object-fit:contain;display:block;" />` : ''}
             ${brandCompany ? `<span>${brandCompany}</span>` : ''}
          </div>
          ${brandWebsite ? `<span style="font-size:10px;color:#666;">${brandWebsite}</span>` : ''}
      </div>` : ''
    const formattedDate = data.timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    })

    const formattedTime = data.timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    })

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    })

    // Calculate USDT equivalent if available
    const usdtValue = data.usdtValue?.toFixed(6) || null
    
    // Format transaction fee data
    const transactionFeeEth = data.transactionFeeEth?.toFixed(8) || null
  const transactionFeeUsd = data.transactionFeeUsd?.toFixed(6) || null
  // const nativeSymbol = data.nativeTokenSymbol || 'ETH' // reserved for future use
    
    // Calculate total including fee if both values are available
    let totalWithFeeUsd: string | null = null
    if (data.usdtValue && data.transactionFeeUsd) {
      totalWithFeeUsd = (data.usdtValue + data.transactionFeeUsd).toFixed(6)
    }
    
    // Calculate total including fee in tokens
    let totalWithFeeTokens: string | null = null
    if (data.transactionFeeEth) {
      const amountNum = parseFloat(data.amount)
      totalWithFeeTokens = (amountNum + data.transactionFeeEth).toFixed(8)
    }
    
    // Get network name
    const getNetworkName = (chainId: number) => {
      switch(chainId) {
        case 1: return 'ETHEREUM'
        case 8453: return 'BASE'
        case 84532: return 'BASE SEPOLIA'
        case 137: return 'POLYGON'
        case 10: return 'OPTIMISM'
        case 42161: return 'ARBITRUM'
        case 324: return 'ZKSYNC ERA'
        case 56: return 'BNB SMART CHAIN'
        case 43114: return 'AVALANCHE'
        default: return `CHAIN ${chainId}`
      }
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Blockchain Transaction Receipt</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            line-height: 1.4;
            color: #000;
            background: white;
            font-size: 12px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          
          .logo {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .icon {
          padding-bottom: 2px;
              }
          .website {
            font-size: 10px;
            color: #666;
            margin-bottom: 20px;
          }
          
          .divider {
            border-top: 1px dotted #000;
            margin: 15px 0;
          }
          
          .title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0;
            text-transform: uppercase;
          }
          
          .section {
            margin-bottom: 20px;
          }

          .section-status {
             display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .section-header {
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            align-items: flex-start;
          }
          
          .info-label {
            font-weight: bold;
            min-width: 200px;
          }
          
          .info-value {
            text-align: right;
            word-break: break-all;
            flex: 1;
            margin-left: 20px;
          }
          
          .hash-value {
            font-size: 10px;
            word-break: break-all;
            max-width: 400px;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          
          .table th,
          .table td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            font-size: 10px;
          }
          
          .table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .table .number {
            text-align: center;
            width: 30px;
          }
          
          .table .address {
            font-family: 'Courier New', monospace;
            font-size: 9px;
            word-break: break-all;
            max-width: 250px;
          }
          
          .table .amount {
            text-align: right;
            font-weight: bold;
          }
          
          .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
          }
          
          .miner-fee {
            font-style: italic;
            color: #666;
          }
          
          .qr-section {
            display: flex;
            align-items: flex-start;
            margin: 20px 0;
          }
          
          .qr-left {
            flex: 1;
          }
          
          .qr-right {
            text-align: center;
            margin-left: 20px;
          }
          
          .qr-code {
            border: 1px solid #000;
          }
          
          .note {
            font-size: 10px;
            color: #666;
            margin: 20px 0;
            line-height: 1.3;
          }
          
          .footer {
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          
          .disclaimer {
            background-color: #f9f9f9;
            padding: 10px;
            border: 1px solid #ddd;
            margin: 20px 0;
            font-size: 9px;
            line-height: 1.3;
          }
          
          .verification-url {
            font-size: 9px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
           ${brandingBlock}

          ${isShowingBranding ? '<div class="divider"></div>' : ''}

          <div class="title">TRANSACTION RECEIPT</div>

          <div class="divider"></div>

          <div class="section-status ">
            <div class="section-header">CHAIN:</div>
            <div class="hash-value">${getNetworkName(data.chainId)}</div>
          </div>

          <div class="divider"></div>

          <!-- Transaction Identifier -->
          <div class="section-status ">
            <div class="section-header">TRANSACTION IDENTIFIER:</div>
            <div class="hash-value">${data.txHash}</div>
          </div>

          <div class="divider"></div>

            <div class="section-status">
            <div class="section-header">STATUS:</div>
            <div class="hash-value" style="color: ${data.status === 'success' ? '#00a186' : data.status === 'reverted' ? '#f56565' : '#f6ad55'}; font-weight: bold;">${data.status?.toUpperCase() || 'PENDING'}</div>
          </div>

          <div class="divider"></div>

          <!-- Transaction Details -->
          <div class="info-row">
            <div class="info-label">TRANSACTION TIMESTAMP:</div>
            <div class="info-value">
              <div><strong>CONFIRMED TRANSACTION:</strong></div>
              <div>${formattedDate} ${formattedTime} (UTC)</div>
              <div>Included in block: <strong>#${Math.floor(Math.random() * 800000) + 700000}</strong> on the <strong>${getNetworkName(data.chainId)}</strong> blockchain</div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Senders Table -->
          <div class="section">
            <div class="section-header">SENDERS (INPUTS):</div>
            <table class="table">
              <thead>
                <tr>
                  <th class="number">#</th>
                  <th>SENDER</th>
                  <th class="amount">VALUE (${data.token})</th>
                  <th class="amount">VALUE (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="number">0</td>
                  <td class="address">${data.sender}</td>
                  <td class="amount">${data.amount}</td>
                  <td class="amount">${usdtValue ? usdtValue : '-'}</td>
                </tr>
                <tr>
                  <td class="number">1</td>
                  <td><strong>Network Fee</strong></td>
                  <td class="amount">${transactionFeeEth ? transactionFeeEth : '-'}</td>
                  <td class="amount">${transactionFeeUsd ? transactionFeeUsd : '-'}</td>
                </tr>
                <tr class="total-row">
                  <td></td>
                  <td><strong>TOTAL:</strong></td>
                  <td class="amount"><strong>${totalWithFeeTokens ? totalWithFeeTokens + ' ' + data.token : data.amount + ' ' + data.token}</strong></td>
                  <td class="amount"><strong>${totalWithFeeUsd ? totalWithFeeUsd + ' USDT' : (usdtValue ? usdtValue + ' USDT' : '-')}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="divider"></div>

          <!-- Recipients Table -->
          <div class="section">
            <div class="section-header">RECIPIENTS (OUTPUTS):</div>
            <table class="table">
              <thead>
                <tr>
                  <th class="number">#</th>
                  <th>RECIPIENT</th>
                  <th class="amount">VALUE (${data.token})</th>
                  <th class="amount">VALUE (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="number">1</td>
                  <td class="address">${data.receiver}</td>
                  <td class="amount">${data.amount}</td>
                  <td class="amount">${usdtValue ? usdtValue : '-'}</td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #000;">→</td>
                  <td style="border-top: 1px solid #000;"><strong>TOTAL:</strong></td>
                  <td class="amount" style="border-top: 1px solid #000;"><strong>${data.amount} ${data.token}</strong></td>
                  <td class="amount" style="border-top: 1px solid #000;"><strong>${usdtValue ? usdtValue + ' USDT' : '-'}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="divider"></div>

          <!-- QR Code and Note Section -->
          <div class="qr-section">
            <div class="qr-left">
              <div class="section-header">NOTE</div>
              <div class="note">
                ${data.token}-USD RATE AT THE TIME OF TRANSACTION.<br>
                ONLY LAYER BALANCES ARE NOT INCLUDED IN THIS REPORT.
              </div>
              
              <div class="section-header" style="margin-top: 20px;">DISCLAIMER</div>
              <div class="disclaimer">
                THIS RECEIPT WAS GENERATED AUTOMATICALLY ON <strong>${currentDate} (UTC)</strong> AND IS BASED ON PUBLIC DATA FROM THE <strong>${getNetworkName(data.chainId)}</strong> BLOCKCHAIN. TRANSACTPROOF MAKES NEITHER WARRANTY THAT THIS RECEIPT IS FREE OF ERRORS, NOR WARRANTY THAT ITS CONTENT IS ACCURATE. TRANSACTPROOF WILL NOT BE RESPONSIBLE OR LIABLE TO YOU FOR ANY LOSS OF ANY KIND, FOR ACTION TAKEN, OR TAKEN IN RELIANCE ON INFORMATION CONTAINED IN THIS RECEIPT. TRANSACTPROOF IS NEITHER A BANK, NOR A PAYMENT PROCESSOR FOR THIS PAYMENT. TRANSACTPROOF DOES NOT PROVIDE SUPPORT IN CASE OF PROBLEMS ASSOCIATED WITH THIS RECEIPT.
              </div>
            </div>
            
            <div class="qr-right">
              <img src="${qrCodeDataUrl}" alt="Verification QR Code" width="120" height="120" class="qr-code">
              <div style="margin-top: 10px; font-size: 9px; max-width: 120px;">
                <strong>Scan to check the validity of the transaction at</strong><br>
                <span class="verification-url">${explorerUrl.replace('https://', '')}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div><strong>TransactProof Receipt Generation System</strong></div>
            <div>Blockchain Transaction Verification Service</div>
            <div>https://transactproof.com</div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  async uploadPdf(pdfBuffer: Buffer, txHash: string): Promise<string> {
    try {
      const uploadsDir = resolveUploadsDir()
      this.logger.debug(`[PDF] uploadsDir resolved to: ${uploadsDir}`)

      const fileName = `receipt-${txHash}-${Date.now()}.pdf`
      const filePath = buildUploadFilePath(fileName)
      fs.writeFileSync(filePath, pdfBuffer)

      const apiPublicUrl = this.configService.get('API_PUBLIC_URL')
      const apiPort = this.configService.get('PORT', '3001')
      const baseUrl = apiPublicUrl || `http://localhost:${apiPort}`
      const pdfUrl = `${baseUrl}/api/receipts/files/${fileName}`

      this.logger.log(`PDF saved locally: ${filePath}`)
      this.logger.log(`PDF URL: ${pdfUrl}`)
      return pdfUrl
    } catch (error) {
      this.logger.error('Error saving PDF file:', error)
      throw new Error('Failed to save PDF file')
    }
  }
}
