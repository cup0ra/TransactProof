import { Module } from '@nestjs/common'
import { ReceiptsController } from './receipts.controller'
import { ReceiptsService } from './receipts.service'
import { BrandingService } from './services/branding.service'
import { PdfService } from './pdf.service'
import { BlockchainService } from './blockchain.service'
import { PriceService } from './price.service'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [CommonModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, PdfService, BlockchainService, PriceService, BrandingService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}