import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/entities/user.entity';

export class CreateUserDto {
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

  @ApiProperty({ description: "User's phone number", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    enum: ['supervisor', 'student'],
    description: 'Role of the user (admin and coordinator not allowed)',
  })
  @IsEnum(['supervisor', 'student'], {
    message: 'role must be one of the following values: supervisor, student',
  })
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({
    description: 'Maximum number of students a supervisor can supervise',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxStudents?: number; // only for supervisor
}
