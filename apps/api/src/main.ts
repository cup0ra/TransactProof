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
  
  // CORS
  const corsOrigin = configService.get('CORS_ORIGIN')
  app.enableCors({
    origin: corsOrigin || true, // Allow all origins if not specified
    credentials: true, // Critical for cookies in cross-origin requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  })

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