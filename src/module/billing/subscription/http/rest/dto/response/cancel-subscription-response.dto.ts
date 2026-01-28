import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for cancelling a subscription
 */
export class CancelSubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  @Expose()
  subscriptionId: string;

  @ApiProperty({ description: 'Timestamp when subscription was cancelled' })
  @Expose()
  cancelledAt: Date;

  @ApiProperty({ description: 'Reason for cancellation' })
  @Expose()
  reason: string;

  @ApiProperty({ description: 'Confirmation message' })
  @Expose()
  message: string;

  static from(result: any): CancelSubscriptionResponseDto {
    const dto = new CancelSubscriptionResponseDto();
    dto.subscriptionId = result.subscriptionId;
    dto.cancelledAt = result.cancelledAt;
    dto.reason = result.reason;
    dto.message = result.message;
    return dto;
  }
}
