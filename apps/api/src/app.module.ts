import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import * as path from 'path'
import { ThrottlerModule } from '@nestjs/throttler'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './auth/auth.module'
import { ReceiptsModule } from './receipts/receipts.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(__dirname, '..', '.env'),
        '.env',
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '10'),
      },
    ]),
    DatabaseModule,
    AuthModule,
    ReceiptsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
