import { Injectable } from '@nestjs/common';
import { BillingSubscriptionApi } from '@sharedModule/integration/interface/billing-integration.interface';
import { DefaultPrismaRepository } from '@sharedModule/persistence/prisma/default.prisma.repository';
import { PrismaService } from '@sharedModule/persistence/prisma/prisma.service';

/**
 * This repository is worst case scenario, it is not recommended to use it.
 * Because it is not following the DDD principles.
 * This repo is accessing a database of another bounded context.
 * How the owner of data doesn't known about this access, if it changes the database schema, this module will be affected.
 */
@Injectable()
export class BillingSubscriptionRepository
  extends DefaultPrismaRepository
  implements BillingSubscriptionApi
{
  private readonly model: PrismaService['subscription'];

  constructor(private readonly prisma: PrismaService) {
    super();
    this.model = this.prisma.subscription;
  }

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    try {
      const subscription = await this.model.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
        },
      });

      return !!subscription;
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }
}
