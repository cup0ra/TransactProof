import { Test, TestingModule } from '@nestjs/testing'
import { ReceiptsService } from './services/receipts.service'
import { BrandingService } from './services/branding.service'
import { PrismaService } from '../database/prisma.service'
import { BlockchainService } from './blockchain.service'
import { PdfService } from './pdf.service'
import { ConfigService } from '@nestjs/config'

// Minimal mocks
class PrismaMock {
  user = {
    findUnique: jest.fn(),
    update: jest.fn(),
  }
  receipt = {
    create: jest.fn().mockResolvedValue({
      id: 'r1', txHash: '0xhash', sender: '0xS', receiver: '0xR', amount: 1, token: 'ETH', chainId: 1, pdfUrl: 'http://pdf', description: undefined, createdAt: new Date(),
    })
  }
}
class BlockchainMock {
  verifyTransactionExists = jest.fn().mockResolvedValue(true)
  getUniversalTxDetails = jest.fn().mockResolvedValue({
    networkName: 'Ethereum Mainnet',
    chainId: 1,
    explorerUrl: 'http://explorer/tx/0xhash',
    receipt: { from: '0xS', to: '0xR', status: 'success', gasUsed: 21000n },
    internalNativeTransfers: [],
    erc20Transfers: [],
    sender: '0xS',
    receiver: '0xR',
    amount: '1',
    token: 'ETH',
    tokenFrom: 'ETH',
    tokenTo: 'ETH',
    amountFrom: '1',
    amountTo: '1',
    timestamp: new Date(),
    status: 'success',
    gasUsed: '21000',
    gasPrice: '1',
    transactionFeeEth: 0.000021,
    nativeTokenSymbol: 'ETH'
  })
}
class BrandingMock { getUserBranding = jest.fn().mockResolvedValue(null) }
class PdfMock { 
  generateReceiptPdf = jest.fn().mockResolvedValue(Buffer.from('PDF'))
  uploadPdf = jest.fn().mockResolvedValue('http://pdf')
}


describe('ReceiptsService free generation', () => {
  let service: ReceiptsService
  let prisma: PrismaMock

  beforeEach(async () => {
    prisma = new PrismaMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        { provide: PrismaService, useValue: prisma },
        { provide: BlockchainService, useClass: BlockchainMock },
        { provide: PdfService, useClass: PdfMock },
        { provide: ConfigService, useValue: { get: () => '0' } }, // disable delay
        { provide: BrandingService, useClass: BrandingMock },
      ],
    }).compile()

    service = module.get(ReceiptsService)
  })

  it('should bypass payment and decrement freeGenerationsRemaining if available', async () => {
    prisma.user.findUnique.mockResolvedValue({ freeGenerationsRemaining: 1, freeUntil: null })
    prisma.user.update.mockResolvedValue({})

    const result = await service.payAndGenerate({ txHash: '0xhash', description: 'test' } as any, '0xUser', 'user1')

    expect(prisma.user.findUnique).toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user1' },
      data: { freeGenerationsRemaining: { decrement: 1 } },
    }))
    expect(result).toHaveProperty('id')
  })

  it('should require payment if no freeGenerationsRemaining', async () => {
    prisma.user.findUnique.mockResolvedValue({ freeGenerationsRemaining: 0, freeUntil: null })

    await expect(
      service.payAndGenerate({ txHash: '0xhash', description: 'test' } as any, '0xUser', 'user1')
    ).rejects.toThrow(/Payment/)
  })
})
