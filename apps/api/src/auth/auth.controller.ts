import { Controller, Get, Post, Body, Res, Req, UseGuards } from '@nestjs/common'
import { Response, Request } from 'express'
import { ThrottlerGuard } from '@nestjs/throttler'
import { JwtAuthGuard } from './jwt-auth.guard'
import { AuthService } from './auth.service'
import { VerifyDto } from './dto/verify.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Generate nonce for SIWE' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  async getNonce() {
    return this.authService.generateNonce()
  }

  @Post('verify')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Verify SIWE signature and authenticate user' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async verify(
    @Body() verifyDto: VerifyDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifySiweMessage(verifyDto)
    
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieName = process.env.SESSION_COOKIE_NAME || 'tp_session'
    
    // Set JWT cookie with proper cross-domain settings
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // Only HTTPS in production
      sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' allows cross-domain
      maxAge: parseInt(process.env.SESSION_TTL_MIN || '30') * 60 * 1000,
      ...(isProduction && process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
    }
    
    response.cookie(cookieName, result.accessToken, cookieOptions)

    return {
      walletAddress: result.user.walletAddress,
      expiresAt: result.expiresAt,
      // Also return token in response for debugging/alternative auth
      ...(process.env.NODE_ENV !== 'production' && { accessToken: result.accessToken }),
    }
  }

  @Get('debug/cookies')
  @ApiOperation({ summary: 'Debug endpoint to check cookies (remove in production)' })
  @ApiResponse({ status: 200, description: 'Cookie debug info' })
  async debugCookies(@Req() req: Request) {
    return {
      cookies: req.cookies,
      headers: {
        cookie: req.headers.cookie,
        authorization: req.headers.authorization,
        origin: req.headers.origin,
        referer: req.headers.referer,
      },
      sessionCookieName: process.env.SESSION_COOKIE_NAME || 'tp_session',
      nodeEnv: process.env.NODE_ENV,
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: Request) {
    return {
      walletAddress: req.user.walletAddress,
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.invalidateSession(req.user.jwtId)
    
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieName = process.env.SESSION_COOKIE_NAME || 'tp_session'
    
    response.clearCookie(cookieName, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    })
    
    return { message: 'Logout successful' }
  }
}
