import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCoordinatorDto {
  @ApiProperty({ description: "User's fullname" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Institution ID - staffId or matricNo' })
  @IsString()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({ description: "User's email", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: "User's password" })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: "User's phone number", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'departmentID associated with user' })
  @IsNumber()
  @IsNotEmpty()
  departmentId: number;
}
