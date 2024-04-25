import { OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/prisma-client';

export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    this.$connect();
  }
  async onModuleDestroy() {
    this.$disconnect();
  }
}
