import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { AuthService } from './auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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
        (request: Request) => {
          const cookieName = configService.get('SESSION_COOKIE_NAME', 'tp_session')
          return request?.cookies?.[cookieName]
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    })
  }

  async validate(payload: any) {
    return this.authService.validateJwtPayload(payload)
  }
}