import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as path from 'path'
import { ThrottlerModule } from '@nestjs/throttler'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './auth/auth.module'
import { ReceiptsModule } from './receipts/receipts.module'
import { FeedbackModule } from './feedback/feedback.module'
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
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          ttl: parseInt(configService.get('THROTTLE_TTL', '60')),
          limit: parseInt(configService.get('THROTTLE_LIMIT', '10')),
        },
      ],
      inject: [ConfigService],
    }),
    DatabaseModule,
    AuthModule,
    ReceiptsModule,
    FeedbackModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
