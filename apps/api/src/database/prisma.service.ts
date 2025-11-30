import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaService
  implements OnModuleInit, OnModuleDestroy {

  private adapterPg = new PrismaPg({
    connectionString: process.env.DATABASE_URL
  });
  private adapterSqlite3 = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db"
})
adapter = this.configService.get('NODE_ENV') === 'production' ? this.adapterPg : this.adapterSqlite3;
  private prisma = new PrismaClient({ adapter: this.adapter });

    constructor(
      private readonly configService: ConfigService,
    ) {}
  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  get client() {
    return this.prisma;
  }
}