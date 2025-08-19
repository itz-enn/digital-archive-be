import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: "Department's Name" })
  @IsString()
  @IsNotEmpty()
  name: string;
}
