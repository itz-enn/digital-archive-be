import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ type: [Number], description: 'Array of student IDs' })
  studentIds: number[];

  @ApiProperty({ type: String, description: 'Notification message' })
  message: string;
}
