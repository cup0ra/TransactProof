import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'
import './auth/types/user.type'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Security
  app.use(helmet())
  
  // CORS (Strict origin for credentialed cookies; avoid wildcard with credentials)
  const configuredOrigin = configService.get('CORS_ORIGIN') || 'https://transact-proof.vercel.app'
  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser / server side requests without origin header
      if (!origin) return callback(null, true)
      if (origin === configuredOrigin) return callback(null, true)
      return callback(new Error(`Origin not allowed: ${origin}`), false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
  console.log('[CORS] Allowed origin:', configuredOrigin)

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