import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAbstractIntroDto {
  @ApiPropertyOptional({ description: 'Project abstract' })
  @IsNotEmpty()
  @IsString()
  abstract: string;

  @ApiPropertyOptional({
    description: 'Project introduction - background to the study',
  })
  @IsNotEmpty()
  @IsString()
  introduction: string;
}
