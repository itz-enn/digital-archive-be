import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class EditProfileDto {
  @ApiProperty({ description: 'Full name of the user', required: false })
  @IsOptional()
  @IsString()
  fullname?: string;

  @ApiProperty({ description: 'Email address of the user', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Phone number of the user', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Institution ID of the user', required: false })
  @IsOptional()
  @IsString()
  institutionId?: string;
}
