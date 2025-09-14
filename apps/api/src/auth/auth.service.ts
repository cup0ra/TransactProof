import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { SiweMessage } from 'siwe'
import { PrismaService } from '../database/prisma.service'
import { VerifyDto } from './dto/verify.dto'
import { randomBytes } from 'crypto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateNonce(walletAddress?: string) {
    const nonce = randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await this.prisma.nonce.create({
      data: {
        walletAddress: walletAddress || '',
        nonce,
        expiresAt,
      },
    })

    return { nonce }
  }

  async verifySiweMessage(verifyDto: VerifyDto) {
    try {
      const siweMessage = new SiweMessage(verifyDto.message)

      // Verify signature
      const result = await siweMessage.verify({
        signature: verifyDto.signature,
        domain: this.configService.get('SIWE_DOMAIN'),
        time: new Date().toISOString(),
      })

      if (!result.success) {
        throw new UnauthorizedException('Invalid signature')
      }

      // Check domain and chainId
      if (siweMessage.domain !== this.configService.get('SIWE_DOMAIN')) {
        throw new UnauthorizedException('Invalid domain')
      }

      if (siweMessage.chainId != this.configService.get('BASE_CHAIN_ID', 84532)) {
        throw new UnauthorizedException('Invalid chain ID')
      }

      // Verify nonce
      const nonceRecord = await this.prisma.nonce.findUnique({
        where: { nonce: siweMessage.nonce },
      })

      if (!nonceRecord || nonceRecord.used || nonceRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired nonce')
      }

      // Mark nonce as used
      await this.prisma.nonce.update({
        where: { nonce: siweMessage.nonce },
        data: { used: true },
      })

      // Upsert user
      const user = await this.prisma.user.upsert({
        where: { walletAddress: siweMessage.address },
        update: {},
        create: { walletAddress: siweMessage.address },
      })

      // Create session
      const jwtId = randomBytes(16).toString('hex')
      const expiresAt = new Date(
        Date.now() + parseInt(this.configService.get('SESSION_TTL_MIN', '30')) * 60 * 1000
      )

      await this.prisma.session.create({
        data: {
          userId: user.id,
          jwtId,
          expiresAt,
        },
      })

      // Generate JWT
      const payload = {
        sub: user.id,
        walletAddress: user.walletAddress,
        jti: jwtId,
      }

      const accessToken = this.jwtService.sign(payload)

      return {
        user,
        accessToken,
        expiresAt: expiresAt.toISOString(),
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new BadRequestException('Invalid SIWE message format')
    }
  }

  async validateJwtPayload(payload: any) {
    try {
      // Check if session exists and is valid
      const session = await this.prisma.session.findUnique({
        where: { jwtId: payload.jti },
        include: { user: true },
      })

      if (!session || session.expiresAt < new Date()) {
        this.logger.warn(`Invalid or expired session for jwtId: ${payload.jti}`)
        throw new UnauthorizedException('Session expired')
      }

      return {
        id: session.user.id,
        walletAddress: session.user.walletAddress,
        jwtId: payload.jti,
      }
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`, error.stack)
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException('Invalid session')
    }
  }

  async invalidateSession(jwtId: string) {
    await this.prisma.session.delete({
      where: { jwtId },
    })
  }
}