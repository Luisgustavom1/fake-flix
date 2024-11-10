import { Injectable } from '@nestjs/common';
import { BillingSubscriptionStatusApi } from '@sharedModule/integration/interface/billing-integration.interface';
import { DefaultPrismaRepository } from '@sharedModule/persistence/prisma/default.prisma.repository';
import { PrismaService } from '@sharedModule/persistence/prisma/prisma.service';

@Injectable()
export class BillingSubscriptionRepository
  extends DefaultPrismaRepository
  implements BillingSubscriptionStatusApi
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
