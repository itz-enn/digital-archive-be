import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
  Get,
  Query,
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
} from '@nestjs/swagger';
import { StudentService } from './student.service';
import { SubmitTopicsDto } from './dto/submit-topics.dto';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { UserPayload } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/utils/config/multer.config';
import { ProjectStatus } from 'src/entities/project.entity';

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
    summary:
      'Delete a project topic. (Only topics in PROPOSAL stage can be deleted)',
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

  @ApiOperation({ summary: 'Upload a project file' })
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
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: UserPayload },
  ) {
    if (!file) throw new UnauthorizedException('No file uploaded');
    return this.studentService.uploadFile(req.user.id, file.path);
  }

  @ApiOperation({ summary: 'Get previously uploaded files' })
  @ApiResponse({ status: 200, description: 'Uploaded files retrieved' })
  @ApiResponse({ status: 400, description: 'Project not found' })
  @ApiQuery({
    name: 'projectStage',
    required: false,
    enum: ProjectStatus,
    description: 'Filter by project stage',
  })
  @Get('uploaded-files')
  async previouslyUploadedFile(
    @Req() req: Request & { user: UserPayload },
    @Query('projectStage') projectStage?: ProjectStatus,
  ) {
    return this.studentService.previouslyUploadedFile(
      req.user.id,
      projectStage,
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

  // @ApiOperation({ summary: 'Get analytics for student dashboard' })
  // @ApiResponse({ status: 200, description: 'Student analytics retrieved' })
  // @Get('analytics')
  // async getStudentAnalytics(@Req() req: Request & { user: UserPayload }) {
  //   return await this.studentService.getStudentAnalytics(req.user.id);
  // }
}
