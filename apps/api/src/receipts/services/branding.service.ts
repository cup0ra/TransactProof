import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

export interface UserBrandingDTO {
  companyName?: string
  website?: string
  logoDataUrl?: string
  showErc20Transfers?: boolean
}

@Injectable()
export class BrandingService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserBranding(userId: string) {
    return this.prisma.client.userBranding.findUnique({ where: { userId } })
  }

  async upsertUserBranding(userId: string, data: UserBrandingDTO) {
    // Trim & normalize
    const companyName = data.companyName?.trim() || null
    const website = data.website?.trim() || null
    const logoDataUrl = data.logoDataUrl || null
    const showErc20Transfers = data.showErc20Transfers === true

    return this.prisma.client.userBranding.upsert({
      where: { userId },
      create: { userId, companyName, website, logoDataUrl, showErc20Transfers },
      update: { companyName, website, logoDataUrl, showErc20Transfers },
    })
  }

  async ensureExists(userId: string) {
    const existing = await this.getUserBranding(userId)
    if (!existing) throw new NotFoundException('Branding not found')
    return existing
  }
}
