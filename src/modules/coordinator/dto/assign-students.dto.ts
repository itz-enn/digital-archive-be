import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AssignStudentsDto {
  @ApiProperty({description: 'The ID of the supervisor'})
  @IsNumber()
  @IsNotEmpty()
  supervisorId: number;

  @ApiProperty({description: 'Array containing institution IDs of students'})
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  studentInstitutionIds: string[];
}
