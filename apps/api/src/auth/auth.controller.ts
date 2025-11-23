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
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const isProd = this.configService.get('NODE_ENV') === 'production';
  const cookieName = this.configService.get('SESSION_COOKIE_NAME', 'tp_session');
  const refreshCookieName = this.configService.get('REFRESH_COOKIE_NAME', 'tp_refresh');

  const sessionTtlMs = Number(this.configService.get('SESSION_TTL_MIN') ?? 30) * 60 * 1000;
  const refreshTtlMs = Number(this.configService.get('REFRESH_TTL_DAYS') ?? 7) * 24 * 60 * 60 * 1000;


  const topLevelDomain = this.configService.get<string>('TOP_LEVEL_DOMAIN');
  const origin = (req.headers.origin ?? '') as string;
  const host = req.hostname ?? '';

  const isSameSite =
    !!topLevelDomain &&
    host.endsWith(topLevelDomain) &&
    origin.includes(topLevelDomain);

    const sameSite: 'lax' | 'none' = 'lax';

  try {
    const result = await this.authService.verifySiweMessage(verifyDto);

    const commonCookie = {
      httpOnly: true,
      secure: isProd,   
      sameSite,
      path: '/',           
    } as const;

    res.cookie(cookieName, result.accessToken, { ...commonCookie, maxAge: sessionTtlMs });
    res.cookie(refreshCookieName, result.refreshToken, { ...commonCookie, maxAge: refreshTtlMs });

    res.setHeader('Cache-Control', 'no-store');

    return {
      ok: true,
      walletAddress: result.user.walletAddress,
      freeGenerationsRemaining: (result.user as any).freeGenerationsRemaining,
      freeUntil: (result.user as any).freeUntil,
      expiresAt: result.expiresAt,
      refreshExpiresAt: result.refreshExpiresAt,
      ...(isProd ? {} : { accessToken: result.accessToken, refreshToken: result.refreshToken }),
    };
  } catch (e) {
    const clearOpts = { path: '/', httpOnly: true, secure: isProd, sameSite } as const;
    res.clearCookie(cookieName, clearOpts);
    res.clearCookie(refreshCookieName, clearOpts);
    throw new UnauthorizedException('Invalid signature');
  }
}

@Post('refresh')
@UseGuards(ThrottlerGuard)
@ApiOperation({ summary: 'Refresh access token using refresh token' })
@ApiResponse({ status: 200, description: 'Token refreshed successfully' })
@ApiResponse({ status: 401, description: 'Invalid refresh token' })
async refresh(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const isProd = this.configService.get('NODE_ENV') === 'production';
  const cookieName = this.configService.get('SESSION_COOKIE_NAME', 'tp_session');
  const refreshCookieName = this.configService.get('REFRESH_COOKIE_NAME', 'tp_refresh');

  const sessionTtlMs = Number(this.configService.get('SESSION_TTL_MIN') ?? 30) * 60 * 1000;
  const refreshTtlMs = Number(this.configService.get('REFRESH_TTL_DAYS') ?? 7) * 24 * 60 * 60 * 1000;

  const topLevelDomain = this.configService.get<string>('TOP_LEVEL_DOMAIN');
  const origin = String(req.headers.origin ?? '');
  const host = req.hostname ?? '';
  const isSameSite =
    !!topLevelDomain &&
    host.endsWith(topLevelDomain) &&
    origin.includes(topLevelDomain);

  const sameSite: 'lax' | 'none' =  'lax' 

  const clearOpts = { path: '/', httpOnly: true, secure: isProd, sameSite } as const;

  const refreshToken = req.cookies?.[refreshCookieName];
  if (!refreshToken) {
    res.clearCookie(cookieName, clearOpts);
    res.clearCookie(refreshCookieName, clearOpts);
    throw new UnauthorizedException('Refresh token not found');
  }

  try {
    const result = await this.authService.refreshAccessToken(refreshToken);

    const commonCookie = {
      httpOnly: true,
      secure: isProd, 
      sameSite,
      path: '/',          
    } as const;

    res.cookie(cookieName, result.accessToken, { ...commonCookie, maxAge: sessionTtlMs });
    res.cookie(refreshCookieName, result.refreshToken, { ...commonCookie, maxAge: refreshTtlMs });

    res.setHeader('Cache-Control', 'no-store');

    return {
      ok: true,
      walletAddress: result.user.walletAddress,
      freeGenerationsRemaining: (result.user as any).freeGenerationsRemaining,
      freeUntil: (result.user as any).freeUntil,
      expiresAt: result.expiresAt,
      refreshExpiresAt: result.refreshExpiresAt,
      ...(isProd ? {} : { accessToken: result.accessToken, refreshToken: result.refreshToken }),
    };
  } catch {
    res.clearCookie(cookieName, clearOpts);
    res.clearCookie(refreshCookieName, clearOpts);
    throw new UnauthorizedException('Invalid refresh token');
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
      walletAddress: (req.user as any).walletAddress,
      freeGenerationsRemaining: (req.user as any).freeGenerationsRemaining,
      freeUntil: (req.user as any).freeUntil,
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
