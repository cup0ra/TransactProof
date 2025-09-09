import { ApiProperty } from '@nestjs/swagger'

export class ReceiptResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  txHash: string

  @ApiProperty()
  sender: string

  @ApiProperty()
  receiver: string

  @ApiProperty()
  amount: string

  @ApiProperty()
  token: string

  @ApiProperty()
  chainId: number

  @ApiProperty()
  pdfUrl: string

  @ApiProperty()
  description?: string

  @ApiProperty()
  createdAt: string
}