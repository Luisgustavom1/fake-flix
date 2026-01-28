import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for adding an add-on to subscription
 */
export class AddAddOnResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  @Expose()
  subscriptionId: string;

  @ApiProperty({ description: 'Add-on ID' })
  @Expose()
  addOnId: string;

  @ApiProperty({ description: 'Quantity of add-on added' })
  @Expose()
  quantity: number;

  @ApiProperty({ description: 'Confirmation message' })
  @Expose()
  message: string;

  static from(result: any): AddAddOnResponseDto {
    const dto = new AddAddOnResponseDto();
    dto.subscriptionId = result.subscriptionId;
    dto.addOnId = result.addOnId;
    dto.quantity = result.quantity;
    dto.message = result.message;
    return dto;
  }
}
