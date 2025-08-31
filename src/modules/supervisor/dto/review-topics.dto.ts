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
    enum: ['REJECTED', 'APPROVED'],
    description: 'Status of the proposal (Pending Status not allowed)',
  })
  @IsEnum(['REJECTED', 'APPROVED'], {
    message: 'status must be one of the following values: REJECTED, APPROVED',
  })
  @IsNotEmpty()
  status: ProposalStatus;

  @ApiPropertyOptional({ description: 'Review project', required: false })
  @IsOptional()
  @IsString()
  review?: string;
}
