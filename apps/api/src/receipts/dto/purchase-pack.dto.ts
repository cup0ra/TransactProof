import { IsString, IsNumber, Min, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class PurchasePackDto {
  @ApiProperty({
    description: 'Transaction hash of the payment to the service (token transfer)',
    example: '0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a'
  })
  @IsString()
  paymentTxHash: string

  @ApiProperty({
    description: 'Payment amount in token units (e.g. 9.99)',
    example: 9.99,
    default: 9.99
  })
  @IsNumber()
  @Min(0)
  paymentAmount: number

  @ApiProperty({
    description: 'Payment token symbol',
    enum: ['USDT', 'USDC'],
    example: 'USDT'
  })
  @IsString()
  @IsIn(['USDT', 'USDC'])
  paymentType: string

  @ApiProperty({
    description: 'ERC20 contract address for the token on the current network',
    example: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'
  })
  @IsString()
  paymentContractAddress: string
}
