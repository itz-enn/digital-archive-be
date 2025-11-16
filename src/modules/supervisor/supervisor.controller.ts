import {
  Controller,
  Get,
  Param,
  Body,
  Put,
  Req,
  UseGuards,
  Query,
  NotFoundException,
  Post,
  UploadedFile,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SupervisorService } from './supervisor.service';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { ReviewTopicsDto } from './dto/review-topics.dto';
import { UserPayload } from 'express';
import { StudentService } from '../student/student.service';
import { ProjectStatus } from 'src/entities/project.entity';
import { Assignment } from 'src/entities/assignment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { FileType } from 'src/entities/project-file.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/utils/config/multer.config';

@ApiTags('supervisor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('supervisor')
export class SupervisorController {
  constructor(
    private readonly supervisorService: SupervisorService,
    private readonly studentService: StudentService,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
  ) {}

  @ApiOperation({
    summary:
      'Get students assigned to a supervisor, returns user and project details including approved and rejected topics, project status',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Supervisor ID' })
  @ApiResponse({
    status: 200,
    description: 'List of assigned students',
  })
  @Get('assigned-students/:id')
  async assignedStudentsBySupervisor(@Param('id') id: number) {
    return await this.supervisorService.assignedStudentsBySupervisor(id);
  }

  @ApiOperation({
    summary:
      'Review a student topic proposal only by assigned supervisor, (if a current approved topic exists and approved is passed, the approved topic is changed to rejected)',
  })
  @ApiResponse({ status: 200, description: 'Topic reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Topic not found' })
  @Put('review-topic')
  async reviewTopics(
    @Body() dto: ReviewTopicsDto,
    @Req() req: Request & { user: UserPayload },
  ) {
    return await this.supervisorService.reviewTopics(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Upload a project correction for student' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: Number, description: 'Student ID' })
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
  @Post('upload-file/:id')
  async uploadCorrectionFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: UserPayload },
    @Param('id') id: number,
  ) {
    if (!file) throw new UnauthorizedException('No file uploaded');
    return this.supervisorService.uploadCorrectionFile(
      req.user.id,
      id,
      file.path,
    );
  }

  @ApiOperation({
    summary:
      "View a student's uploaded files including submission and correction",
  })
  @ApiParam({ name: 'id', type: Number, description: 'Student ID' })
  @ApiParam({
    name: 'projectStage',
    enum: ProjectStatus,
    required: false,
    description: 'Filter by project stage',
  })
  @ApiParam({
    name: 'type',
    enum: FileType,
    required: false,
    description: 'Filter by file type',
  })
  @ApiResponse({ status: 200, description: 'Uploaded files retrieved' })
  @ApiResponse({ status: 400, description: 'No uploaded files found' })
  @Get('uploaded-files/:id')
  async previouslyUploadedFile(
    @Param('id') id: number,
    @Req() req: Request & { user: UserPayload },
    @Query('projectStage') projectStage?: ProjectStatus,
    @Query('type') type?: FileType,
  ) {
    const assignment = await this.assignmentRepo.findOne({
      where: {
        student: { id },
        supervisor: { id: req.user.id },
        isActive: true,
      },
    });
    if (!assignment)
      throw new NotFoundException('You are not assigned to this student');
    return this.studentService.previouslyUploadedFile(id, projectStage, type);
  }

  @ApiOperation({
    summary:
      "Update the status of a student project (can't update to previous stage)",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Student ID',
  })
  @ApiResponse({ status: 200, description: 'Project status updated' })
  @ApiResponse({
    status: 400,
    description: 'Cannot move to previous or same stage',
  })
  @Put('update-project-status/:id')
  async updateProjectStatus(
    @Param('id') id: number,
    @Body() dto: UpdateProjectStatusDto,
    @Req() req: Request & { user: UserPayload },
  ) {
    return await this.supervisorService.updateProjectStatus(
      req.user.id,
      id,
      dto,
    );
  }

  @Post('send-notification')
  @ApiOperation({ summary: 'Send a notification to selected students' })
  @ApiResponse({ status: 200, description: 'Notification sent' })
  async sendNotificationToStudents(
    @Req() req: Request & { user: UserPayload },
    @Body() dto: SendNotificationDto,
  ) {
    return await this.supervisorService.sendNotificationToStudents(
      req.user.id,
      dto,
    );
  }
}
