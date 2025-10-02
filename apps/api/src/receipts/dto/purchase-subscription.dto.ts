import { IsString, IsNumber, Min, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class PurchaseSubscriptionDto {
  @ApiProperty({ description: 'Payment transaction hash', example: '0xabc...123' })
  @IsString()
  paymentTxHash: string

  @ApiProperty({ description: 'Subscription payment amount', example: 29.99, default: 29.99 })
  @IsNumber()
  @Min(0)
  paymentAmount: number

  @ApiProperty({ description: 'Token symbol', enum: ['USDT', 'USDC'] })
  @IsString()
  @IsIn(['USDT', 'USDC'])
  paymentType: string

  @ApiProperty({ description: 'Token contract address', example: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' })
  @IsString()
  paymentContractAddress: string
}
