import { Module } from '@nestjs/common'
import { CoinGeckoService } from './services/coingecko.service'
import { TokenManagerService } from './services/token-manager.service'

@Module({
  providers: [CoinGeckoService, TokenManagerService],
  exports: [CoinGeckoService, TokenManagerService],
})
export class CommonModule {}