import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class AssignStudentsDto {
  @ApiProperty({ description: 'The ID of the supervisor' })
  @IsNumber()
  @IsNotEmpty()
  supervisorId: number;

  @ApiProperty({ description: 'Array containing institution IDs of students' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  studentInstitutionIds: string[];
}
