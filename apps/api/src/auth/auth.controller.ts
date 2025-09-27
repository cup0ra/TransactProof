import { Controller, Get, Post, Body, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common'
import { Response, Request } from 'express'
import { ThrottlerGuard } from '@nestjs/throttler'
import { ConfigService } from '@nestjs/config'
import { JwtAuthGuard } from './jwt-auth.guard'
import { AuthService } from './auth.service'
import { VerifyDto } from './dto/verify.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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
    
    const isProduction = this.configService.get('NODE_ENV') === 'production'
    const cookieName = this.configService.get('SESSION_COOKIE_NAME', 'tp_session')
    const refreshCookieName = this.configService.get('REFRESH_COOKIE_NAME', 'tp_refresh')
    
    // Base cookie attributes (host-only; avoids domain issues on iOS Safari)
    const sessionTtlMs = parseInt(this.configService.get('SESSION_TTL_MIN', '30')) * 60 * 1000
    const refreshTtlMs = parseInt(this.configService.get('REFRESH_TTL_DAYS', '7')) * 24 * 60 * 60 * 1000

    const commonCookie = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      path: '/',
    }

    const sessionCookieOptions = { ...commonCookie, maxAge: sessionTtlMs }
    const refreshCookieOptions = { ...commonCookie, maxAge: refreshTtlMs }

    response.cookie(cookieName, result.accessToken, sessionCookieOptions)
    response.cookie(refreshCookieName, result.refreshToken, refreshCookieOptions)

    // Debug log (avoid printing tokens)
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log('[Auth][verify] Set cookies', {
        cookieName,
        refreshCookieName,
        secure: commonCookie.secure,
        sameSite: commonCookie.sameSite,
        path: commonCookie.path,
        sessionMaxAge: sessionCookieOptions.maxAge,
        refreshMaxAge: refreshCookieOptions.maxAge,
        userAgent: (response.req as any)?.headers?.['user-agent'],
      })
    }

    return {
      walletAddress: result.user.walletAddress,
      expiresAt: result.expiresAt,
      refreshExpiresAt: result.refreshExpiresAt,
      // Also return token in response for debugging/alternative auth
      ...(this.configService.get('NODE_ENV') !== 'production' && { 
        accessToken: result.accessToken, 
        refreshToken: result.refreshToken 
      }),
    }
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshCookieName = this.configService.get('REFRESH_COOKIE_NAME', 'tp_refresh')
    const refreshToken = req.cookies[refreshCookieName]
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found')
    }

    const result = await this.authService.refreshAccessToken(refreshToken)
    
    const isProduction = this.configService.get('NODE_ENV') === 'production'
    const cookieName = this.configService.get('SESSION_COOKIE_NAME', 'tp_session')
    
    // New cookies (host-only)
    const sessionTtlMs = parseInt(this.configService.get('SESSION_TTL_MIN', '30')) * 60 * 1000
    const refreshTtlMs = parseInt(this.configService.get('REFRESH_TTL_DAYS', '7')) * 24 * 60 * 60 * 1000
    const commonCookie = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      path: '/',
    }
    const sessionCookieOptions = { ...commonCookie, maxAge: sessionTtlMs }
    const refreshCookieOptions = { ...commonCookie, maxAge: refreshTtlMs }

    response.cookie(cookieName, result.accessToken, sessionCookieOptions)
    response.cookie(refreshCookieName, result.refreshToken, refreshCookieOptions)

    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log('[Auth][refresh] Set cookies', {
        cookieName,
        refreshCookieName,
        secure: commonCookie.secure,
        sameSite: commonCookie.sameSite,
        path: commonCookie.path,
        sessionMaxAge: sessionCookieOptions.maxAge,
        refreshMaxAge: refreshCookieOptions.maxAge,
        userAgent: req.headers['user-agent'],
      })
    }

    return {
      walletAddress: result.user.walletAddress,
      expiresAt: result.expiresAt,
      refreshExpiresAt: result.refreshExpiresAt,
      // Also return token in response for debugging/alternative auth
      ...(this.configService.get('NODE_ENV') !== 'production' && { 
        accessToken: result.accessToken, 
        refreshToken: result.refreshToken 
      }),
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
      sessionCookieName: this.configService.get('SESSION_COOKIE_NAME', 'tp_session'),
      nodeEnv: this.configService.get('NODE_ENV'),
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
    
    const isProduction = this.configService.get('NODE_ENV') === 'production'
    const cookieName = this.configService.get('SESSION_COOKIE_NAME', 'tp_session')
    const refreshCookieName = this.configService.get('REFRESH_COOKIE_NAME', 'tp_refresh')
    
    const clearOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      path: '/',
    }
    response.clearCookie(cookieName, clearOptions)
    response.clearCookie(refreshCookieName, clearOptions)
    
    return { message: 'Logout successful' }
  }
}
