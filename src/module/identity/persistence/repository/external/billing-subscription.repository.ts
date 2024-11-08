import { BillingSubscriptionStatusApi } from '@sharedModule/integration/interface/billing-integration.interface';
import { DefaultPrismaRepository } from '@sharedModule/persistence/prisma/default.prisma.repository';
import { PrismaService } from '@sharedModule/persistence/prisma/prisma.service';

export class BillingSubscriptionRepository
  extends DefaultPrismaRepository
  implements BillingSubscriptionStatusApi
{
  private readonly model: PrismaService['subscription'];

  constructor(prisma: PrismaService) {
    super();
    this.model = prisma.subscription;
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
