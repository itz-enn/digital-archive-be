import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProposalStatus } from 'src/entities/project.entity';

export class ReviewTopicsDto {
  @ApiProperty({ description: 'ID of the topic to review' })
  @IsNumber()
  @IsNotEmpty()
  topicId: number;

  @ApiProperty({
    enum: ['rejected', 'approved'],
    description: 'Status of the proposal (Pending Status not allowed)',
  })
  @IsEnum(['rejected', 'approved'], {
    message: 'status must be one of the following values: rejected, approved',
  })
  @IsNotEmpty()
  status: ProposalStatus;

  @ApiPropertyOptional({ description: 'Review project' })
  @IsOptional()
  @IsString()
  review?: string;
}
