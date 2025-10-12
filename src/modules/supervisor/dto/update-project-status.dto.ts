import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProjectStatus } from 'src/entities/project.entity';

export class UpdateProjectStatusDto {
  @ApiProperty({
    enum: ProjectStatus,
    description: 'The new project stage/status to move to',
  })
  @IsEnum(ProjectStatus)
  @IsNotEmpty()
  newStatus: ProjectStatus;
}
