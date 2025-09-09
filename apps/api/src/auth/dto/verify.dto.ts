import { IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class VerifyDto {
  @ApiProperty({
    description: 'SIWE message string',
    example: 'example.com wants you to sign in with your Ethereum account...',
  })
  @IsString()
  @IsNotEmpty()
  message: string

  @ApiProperty({
    description: 'Signature of the SIWE message',
    example: '0x...',
  })
  @IsString()
  @IsNotEmpty()
  signature: string
}