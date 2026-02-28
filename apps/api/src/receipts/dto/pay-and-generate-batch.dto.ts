import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

const MAX_LOGO_BYTES = 500 * 1024

@ValidatorConstraint({ name: 'logoDataUrl', async: false })
class LogoDataUrlConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (typeof value !== 'string') return false
    if (!/^data:image\/(png|jpe?g|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(value)) return false
    const base64 = value.split(',')[1]
    if (!base64) return false
    const bytes = (base64.length * 3) / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
    return bytes <= MAX_LOGO_BYTES
  }

  defaultMessage() {
    return 'logoDataUrl must be a valid image data URL (png/jpeg/svg) not exceeding 500KB'
  }
}

class BatchTransactionDto {
  @ApiProperty({
    description: 'Transaction hash',
    example: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
  })
  @IsString()
  hash: string

  @ApiProperty({
    description: 'Network chain id where transaction exists',
    example: 8453,
  })
  @IsNumber()
  @IsInt()
  @Min(1)
  chainId: number
}

export class PayAndGenerateBatchDto {
  @ApiProperty({
    description: 'List of transactions for receipt generation (hash + chainId)',
    type: [BatchTransactionDto],
    example: [
      { hash: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', chainId: 8453 },
      { hash: '0xb1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', chainId: 8453 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  transactions: BatchTransactionDto[]

  @ApiProperty({
    description: 'Optional description to apply for all generated receipts',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: 'Transaction hash of the single payment for payable receipts in batch',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentTxHash?: string

  @ApiProperty({
    description: 'Total payment amount for all payable receipts in batch',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentAmount?: number

  @ApiProperty({
    description: 'Type of payment token used for batch payment',
    enum: ['ETH', 'USDT', 'USDC'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['ETH', 'USDT', 'USDC'])
  paymentType?: string

  @ApiProperty({
    description: 'Contract address for token payments (not needed for ETH)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentContractAddress?: string

  @ApiProperty({
    description: 'Optional company name for branding (max 80 chars)',
    required: false,
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  companyName?: string

  @ApiProperty({
    description: 'Optional company website (https URL or domain, max 120 chars)',
    required: false,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{2,5})?(\/.*)?$/, {
    message: 'website must be a valid URL or domain',
  })
  website?: string

  @ApiProperty({
    description: 'Inline logo as data URL (png/jpeg/svg, base64, max 500KB)',
    required: false,
  })
  @ValidateIf(o => o.logoDataUrl !== undefined)
  @IsString()
  @Validate(LogoDataUrlConstraint)
  logoDataUrl?: string
}
