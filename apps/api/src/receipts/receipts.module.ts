import { Module } from '@nestjs/common'
import { ReceiptsController } from './controllers/receipts.controller'
import { ReceiptsService } from './services/receipts.service'
import { BrandingService } from './services/branding.service'
import { PdfService } from './services/pdf.service'
import { BlockchainService } from './services/blockchain.service'
import { PriceService } from './services/price.service'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [CommonModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, PdfService, BlockchainService, PriceService, BrandingService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}