import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // DB_POOL_MAX * CLUSTER_WORKERS must stay below PostgreSQL max_connections (default 100)
      max: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT ?? '3000', 10),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
