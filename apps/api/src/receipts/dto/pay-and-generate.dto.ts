import { IsString, IsOptional, IsNumber, Min, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class PayAndGenerateDto {
  @ApiProperty({
    description: 'Transaction hash to generate receipt for',
    example: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
  })
  @IsString()
  txHash: string

  @ApiProperty({
    description: 'Optional description for the receipt',
    example: 'Payment for services',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: 'Transaction hash of the payment to the service',
    example: '0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentTxHash?: string

  @ApiProperty({
    description: 'Amount paid to the service',
    example: 0.0000001,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentAmount?: number

  @ApiProperty({
    description: 'Type of payment token used',
    example: 'ETH',
    enum: ['ETH', 'USDT', 'USDC'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['ETH', 'USDT', 'USDC'])
  paymentType?: string

  @ApiProperty({
    description: 'Contract address for token payments (not needed for ETH)',
    example: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentContractAddress?: string
}