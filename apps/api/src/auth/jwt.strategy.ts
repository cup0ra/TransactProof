import { Injectable, Logger } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { AuthService } from './auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name)

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get('JWT_SECRET')
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables')
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookie
        (request: Request) => {
          const cookieName = configService.get('SESSION_COOKIE_NAME', 'tp_session')
          const token = request?.cookies?.[cookieName]
          
          // Enhanced logging for debugging in production
          if (!token) {
            const availableCookies = Object.keys(request?.cookies || {})
            const cookieHeader = request?.headers?.cookie
            this.logger.warn(`No JWT token found in cookie '${cookieName}'.`, {
              availableCookies,
              cookieHeader: cookieHeader ? 'present' : 'missing',
              userAgent: request?.headers?.['user-agent'],
              origin: request?.headers?.origin,
            })
          } else {
            this.logger.log(`JWT token found in cookie '${cookieName}'`)
          }
          
          return token
        },
        // Fallback to Authorization header (Bearer token)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    })
  }

  async validate(payload: any) {
    return this.authService.validateJwtPayload(payload)
  }
}