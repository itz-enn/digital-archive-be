import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: "User's institution ID" })
  @IsString()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({ description: "User's password" })
  @IsNotEmpty()
  @IsString()
  password: string;
}
