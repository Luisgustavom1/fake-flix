export enum BillingApiSubscriptionStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}

export class BillingApiSubscriptionStatusResponseDto {
  isActive: boolean;
}
