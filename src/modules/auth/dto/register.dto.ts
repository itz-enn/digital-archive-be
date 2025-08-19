import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ description: "User's fullname" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Institution ID - staffId or matricNo' })
  @IsString()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({ description: "User's email" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "User's password" })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: "User's phone number", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    enum: ['COORDINATOR', 'SUPERVISOR', 'STUDENT'],
    description: 'Role of the user (admin not allowed)',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  @Validate((value: UserRole) => value !== UserRole.ADMIN, {
    message: 'Admin role cannot be assigned',
  })
  role: UserRole;

  @ApiProperty({ description: 'Department ID associated with user' })
  @IsNumber()
  @IsNotEmpty()
  departmentId: number;
}
