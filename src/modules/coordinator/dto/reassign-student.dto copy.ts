import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ReassignStudentDto {
  @ApiProperty({ description: 'The ID of the supervisor' })
  @IsNumber()
  @IsNotEmpty()
  supervisorId: number;

  @ApiProperty({ description: 'The ID of the student' })
  @IsNumber()
  @IsNotEmpty()
  studentId: number;
}
