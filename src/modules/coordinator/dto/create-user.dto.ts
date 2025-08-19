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

  @ApiProperty({ description: "User's password" })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: "User's phone number", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  //TODO: test if this works
  @ApiProperty({
    enum: ['SUPERVISOR', 'STUDENT'],
    description: 'Role of the user (admin and coordinator not allowed)',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  @Validate(
    (value: UserRole) =>
      value !== UserRole.ADMIN && value !== UserRole.COORDINATOR,
    {
      message: 'Admin and Coordinator roles cannot be assigned',
    },
  )
  role: UserRole;
}
