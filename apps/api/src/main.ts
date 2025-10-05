import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'
import * as bodyParser from 'body-parser'
import './auth/types/user.type'
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const configService = app.get(ConfigService)

  // Body size limits (branding includes base64 image ~ <= 700KB after base64). Default Express limit (100kb) caused 413.
  const bodyLimit = configService.get('BODY_LIMIT') || '1mb'
  app.use(bodyParser.json({ limit: bodyLimit }))
  app.use(bodyParser.urlencoded({ limit: bodyLimit, extended: true }))

  // Security
  app.use(helmet())
  
  // CORS (Strict origin for credentialed cookies; avoid wildcard with credentials)
  const configuredOrigin = configService.get('CORS_ORIGIN') || 'https://transact-proof.vercel.app'
  app.set('trust proxy', 1);
  app.enableCors({
    origin: [configuredOrigin],
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    exposedHeaders: ['Set-Cookie'],
  });
  // Cookies
  app.use(cookieParser())

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Global prefix
  app.setGlobalPrefix('api')

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TransactProof API')
      .setDescription('API for generating PDF receipts from crypto transactions')
      .setVersion('1.0')
      .addCookieAuth('tp_session')
      .build()
    
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
  }

  const port = configService.get('PORT', 3001)
  await app.listen(port)
  
  console.log(`🚀 TransactProof API running on port ${port}`)
  console.log(`📚 API documentation: http://localhost:${port}/api/docs`)
}

bootstrap()