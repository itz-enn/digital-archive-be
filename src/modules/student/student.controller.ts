import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { StudentService } from './student.service';
import { SubmitTopicsDto } from './dto/submit-topics.dto';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { UserPayload } from 'express';

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
}
