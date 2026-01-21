import { IsOptional, IsDateString, IsUUID } from 'class-validator';

export class RemoveAddOnRequestDto {
  @IsOptional()
  @IsUUID(4)
  userId?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
