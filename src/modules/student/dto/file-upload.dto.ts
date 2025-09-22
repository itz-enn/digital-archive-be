import { ApiProperty } from '@nestjs/swagger';
import { FileStage } from 'src/entities/file-submission.entity';

export class FileUploadDto {
  @ApiProperty({ enum: FileStage })
  fileStage: FileStage;

  @ApiProperty({ type: String })
  version: string;
}
