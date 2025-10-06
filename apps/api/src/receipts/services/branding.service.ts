import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

export interface UserBrandingDTO {
  companyName?: string
  website?: string
  logoDataUrl?: string
}

@Injectable()
export class BrandingService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserBranding(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
  return (this.prisma as any).userBranding.findUnique({ where: { userId } })
  }

  async upsertUserBranding(userId: string, data: UserBrandingDTO) {
    // Trim & normalize
    const companyName = data.companyName?.trim() || null
    const website = data.website?.trim() || null
    const logoDataUrl = data.logoDataUrl || null

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
  return (this.prisma as any).userBranding.upsert({
      where: { userId },
      create: { userId, companyName, website, logoDataUrl },
      update: { companyName, website, logoDataUrl },
    })
  }

  async ensureExists(userId: string) {
    const existing = await this.getUserBranding(userId)
    if (!existing) throw new NotFoundException('Branding not found')
    return existing
  }
}
