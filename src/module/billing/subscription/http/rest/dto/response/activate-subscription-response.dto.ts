import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for activating a subscription
 */
export class ActivateSubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  @Expose()
  subscriptionId: string;

  @ApiProperty({ description: 'Timestamp when subscription was activated' })
  @Expose()
  activatedAt: Date;

  @ApiProperty({ description: 'Current billing period start date' })
  @Expose()
  currentPeriodStart: Date;

  @ApiProperty({
    description: 'Current billing period end date',
    nullable: true,
  })
  @Expose()
  currentPeriodEnd: Date | null;

  @ApiProperty({ description: 'Confirmation message' })
  @Expose()
  message: string;

  static from(result: any): ActivateSubscriptionResponseDto {
    const dto = new ActivateSubscriptionResponseDto();
    dto.subscriptionId = result.subscriptionId;
    dto.activatedAt = result.activatedAt;
    dto.currentPeriodStart = result.currentPeriodStart;
    dto.currentPeriodEnd = result.currentPeriodEnd;
    dto.message = result.message;
    return dto;
  }
}
