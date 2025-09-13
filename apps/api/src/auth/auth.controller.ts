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
    
    // Set JWT cookie
    response.cookie(
      process.env.SESSION_COOKIE_NAME || 'tp_session',
      result.accessToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseInt(process.env.SESSION_TTL_MIN || '30') * 60 * 1000,
      },
    )

    return {
      walletAddress: result.user.walletAddress,
      expiresAt: result.expiresAt,
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
    
    response.clearCookie(process.env.SESSION_COOKIE_NAME || 'tp_session')
    
    return { message: 'Logout successful' }
  }
}
