import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
  Get,
  Query,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiQuery,
  ApiBody,
  PartialType,
} from '@nestjs/swagger';
import { StudentService } from './student.service';
import { SubmitTopicsDto, UpdateTopicDto } from './dto/topics.dto';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { UserPayload } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/utils/config/multer.config';
import { ProjectStatus } from 'src/entities/project.entity';
import { FileType } from 'src/entities/project-file.entity';
import { UpdateAbstractIntroDto } from './dto/update-abstract-intro.dto';

@ApiTags('student')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @ApiOperation({ summary: 'Submit new project topics' })
  @ApiResponse({ status: 200, description: 'Project topics submitted' })
  @Post('submit-topics')
  async submitNewTopics(
    @Body() dto: SubmitTopicsDto,
    @Req() req: Request & { user: UserPayload },
  ) {
    return await this.studentService.submitNewTopics(req.user.id, dto);
  }

  @ApiOperation({
    summary: 'Update a project topic',
  })
  @ApiResponse({ status: 200, description: 'Topic updated' })
  @ApiResponse({
    status: 400,
    description: 'Topic not found',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Topic ID' })
  @Put('topic/:id')
  async updateTopic(
    @Req() req: Request & { user: UserPayload },
    @Param('id') topicId: number,
    @Body() dto: UpdateTopicDto,
  ) {
    return await this.studentService.updateTopic(req.user.id, topicId, dto);
  }

  @ApiOperation({
    summary:
      'Delete a project topic. (Only pending and rejected topics can be deleted)',
  })
  @ApiResponse({ status: 200, description: 'Project topic deleted' })
  @ApiResponse({ status: 400, description: 'Topic not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Topic ID' })
  @Delete('topic/:id')
  async deleteTopic(
    @Req() req: Request & { user: UserPayload },
    @Param('id') topicId: number,
  ) {
    return await this.studentService.deleteTopic(req.user.id, topicId);
  }

  @ApiOperation({ summary: 'Upload a project file for submission' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectFile: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload (Max size: 5MB)',
        },
      },
      required: ['projectFile'],
    },
  })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Project not found' })
  @UseInterceptors(FileInterceptor('projectFile', multerConfig))
  @Post('upload-file')
  async uploadSubmissionFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: UserPayload },
  ) {
    if (!file) throw new UnauthorizedException('No file uploaded');
    return this.studentService.uploadSubmissionFile(req.user.id, file.path);
  }

  @ApiOperation({
    summary:
      'Get uploaded files for a student including corections and submission',
  })
  @ApiResponse({ status: 200, description: 'Uploaded files retrieved' })
  @ApiResponse({ status: 400, description: 'Project not found' })
  @ApiQuery({
    name: 'projectStage',
    required: false,
    enum: ProjectStatus,
    description: 'Filter by project stage',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: FileType,
    description: 'Filter by file type',
  })
  @Get('uploaded-files')
  async previouslyUploadedFile(
    @Req() req: Request & { user: UserPayload },
    @Query('projectStage') projectStage?: ProjectStatus,
    @Query('type') type?: FileType,
  ) {
    return this.studentService.previouslyUploadedFile(
      req.user.id,
      projectStage,
      type,
    );
  }

  @ApiOperation({ summary: 'Delete a project file' })
  @ApiParam({ name: 'id', type: Number, description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 400, description: 'File not found' })
  @Delete('project-file/:id')
  async deleteFile(
    @Req() req: Request & { user: UserPayload },
    @Param('id') id: number,
  ) {
    return this.studentService.deleteFile(req.user.id, id);
  }

  @ApiOperation({
    summary:
      'Update project abstract and introduction only when students are at chapter4_5 stage)',
  })
  @ApiResponse({
    status: 200,
    description: 'Abstract and Introduction updated',
  })
  @ApiResponse({
    status: 400,
    description:
      'Project not in CHAPTER4_5 stage or approved project not found',
  })
  @Put('abstract-intro')
  async updateProjectSections(
    @Body() dto: UpdateAbstractIntroDto,
    @Req() req: Request & { user: UserPayload },
  ) {
    return this.studentService.updateAbstractAndIntro(
      req.user.id,
      dto,
    );
  }
}
