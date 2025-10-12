import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class TopicDto {
  @ApiProperty({ description: 'Title of the project' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description of the project' })
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class SubmitTopicsDto {
  @ApiProperty({
    type: [TopicDto],
    description: 'List of topics to submit',
    minItems: 1,
    maxItems: 3,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  topics: TopicDto[];
}

export class UpdateTopicDto extends PartialType(TopicDto) {}
