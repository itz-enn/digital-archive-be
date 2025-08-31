import {
  Controller,
  Get,
  Param,
  Body,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SupervisorService } from './supervisor.service';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { ReviewTopicsDto } from './dto/review-topics.dto';
import { UserPayload } from 'express';

@ApiTags('supervisor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('supervisor')
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

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
      'Review a student topic proposal only by assigned supervisor, (if a current approved topic exists and APPROVED is passed, the approved topic is changed to REJECTED)',
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
}
