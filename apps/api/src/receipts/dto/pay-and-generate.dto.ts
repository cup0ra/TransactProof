import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsIn,
  MaxLength,
  Matches,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

// 500KB max for logo image (same as frontend)
const MAX_LOGO_BYTES = 500 * 1024

@ValidatorConstraint({ name: 'logoDataUrl', async: false })
class LogoDataUrlConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (typeof value !== 'string') return false
    // Basic pattern check
    if (!/^data:image\/(png|jpe?g|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(value)) return false
    // Size check: decode base64 length portion after comma
    const base64 = value.split(',')[1]
    if (!base64) return false
    // Compute approximate bytes: 3/4 of base64 length (ignore padding nuance for simplicity)
    const bytes = (base64.length * 3) / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
    return bytes <= MAX_LOGO_BYTES
  }

  defaultMessage() {
    return 'logoDataUrl must be a valid image data URL (png/jpeg/svg) not exceeding 500KB'
  }
}

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

  // Branding (optional, per-request, not persisted)
  @ApiProperty({
    description: 'Optional company name for branding (max 80 chars)',
    example: 'TransactProof LLC',
    required: false,
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  companyName?: string

  @ApiProperty({
    description: 'Optional company website (https URL or domain, max 120 chars)',
    example: 'https://transactproof.com',
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