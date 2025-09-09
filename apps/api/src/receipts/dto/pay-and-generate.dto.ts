import { IsString, IsOptional, IsEthereumAddress } from 'class-validator'
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
}