import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SendNotificationDto {
  @ApiProperty({ type: [Number], description: 'Array of student IDs' })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  studentIds: number[];

  @ApiProperty({ type: String, description: 'Notification message' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
