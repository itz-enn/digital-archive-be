import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class StudentLimitDto {
  @ApiProperty({ description: 'Supervisor ID' })
  @IsNumber()
  @IsNotEmpty()
  supervisorId: number;

  @ApiProperty({ description: 'Maximum number of students', example: 5 })
  @IsNumber()
  @IsNotEmpty()
  maxStudents: number;
}
