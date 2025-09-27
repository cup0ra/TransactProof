import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'TransactProof API',
      version: '1.0.0',
    }
  }
}
