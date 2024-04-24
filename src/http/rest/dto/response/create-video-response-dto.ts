import { Expose } from 'class-transformer';
import { IsDate, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateVideoResponseDTO {
  @IsUUID(4)
  @Expose()
  id: string;

  @IsString()
  @Expose()
  title: string;

  @IsString()
  @Expose()
  description: string;

  @IsString()
  @Expose()
  url: string;

  @IsString()
  @Expose()
  thumbnailUrl: string;

  @IsNumber()
  @Expose()
  sizeInKb: number;

  @IsNumber()
  @Expose()
  duration: number;

  @IsDate()
  @Expose()
  createdAt: string;

  @IsDate()
  @Expose()
  updatedAt: string;
}
