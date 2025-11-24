import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAbstractIntroDto {
  @ApiProperty({ description: 'Project abstract' })
  @IsNotEmpty()
  @IsString()
  abstract: string;

  @ApiProperty({
    description: 'Project introduction - background to the study',
  })
  @IsNotEmpty()
  @IsString()
  introduction: string;
}
