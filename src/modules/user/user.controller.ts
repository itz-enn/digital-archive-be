import {
  Controller,
  Get,
  Query,
  Param,
  Put,
  Req,
  Body,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { ProjectCategory } from 'src/entities/archive.entity';
import { EditProfileDto } from './dto/edit-profile.dto';
import { UserPayload } from 'express';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get user profile by ID (admin can view coordinator profile, coordinator can view student and supervisor profile, supervisor and student can view only their own profile)',
  })
  @ApiResponse({
    status: 200,
    description:
      'User profile retrieved, Returns approved topic, project status and supervisor name if role of user is student',
  })
  @ApiResponse({ status: 400, description: 'User not found' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  async getUserProfile(
    @Param('id') id: number,
    @Req() req: Request & { user: UserPayload },
  ) {
    return await this.userService.getUserProfile(req.user.id, id);
  }

  @Put('profile/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit user profile by ID' })
  @ApiResponse({ status: 200, description: 'User profile updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  async editProfile(@Param('id') id: number, @Body() dto: EditProfileDto) {
    return await this.userService.editProfile(id, dto);
  }

  @Get('submitted-topics/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get submitted topics for a student (student or their supervisor only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Submitted topics retrieved' })
  @ApiResponse({
    status: 400,
    description: 'You are not authorized to view these topics',
  })
  async getSubmittedTopics(
    @Param('id') id: number,
    @Req() req: Request & { user: UserPayload },
  ) {
    return await this.userService.getSubmittedTopics(req.user.id, id);
  }

  @Get('archives')
  @ApiOperation({ summary: 'Get archives and total count with filters' })
  @ApiResponse({ status: 200, description: 'Archives retrieved ' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search query (title, authors, keywords)',
  })
  @ApiQuery({
    name: 'category',
    enum: ProjectCategory,
    required: false,
    description: 'Category of project',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    description: 'Department project is associated with',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Year project was written',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page. Note: defaults to 10 if empty',
  })
  async getArchives(
    @Query('search') search?: string,
    @Query('category') category?: ProjectCategory,
    @Query('department') department?: string,
    @Query('year') year?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.userService.getArchives(
      search,
      category,
      department,
      year,
      page,
      limit,
    );
  }

  @Get('archive/:id')
  @ApiOperation({ summary: 'Get info about a single archive by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Archive ID' })
  @ApiResponse({ status: 200, description: 'Archive retrieved' })
  @ApiResponse({ status: 400, description: 'Archive not found' })
  async getArchiveById(@Param('id') id: string) {
    return await this.userService.getArchiveById(Number(id));
  }

  @Delete('delete-user/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user and all associated data' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of user to be deleted',
  })
  @ApiResponse({
    status: 200,
    description: 'User and all associated data deleted',
  })
  @ApiResponse({ status: 400, description: 'User not found' })
  async deleteUserAndAssociations(
    @Param('id') id: number,
    @Req() req: Request & { user: UserPayload },
  ) {
    return await this.userService.deleteUserAndAssociations(req.user.id, id);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all notifications and unread count',
  })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  @ApiQuery({ name: 'page', type: Number, description: 'Page number' })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Items per page. Defaults to 10 if not provided',
  })
  async getNotifications(
    @Req() req: Request & { user: UserPayload },
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.userService.getNotifications(req.user.id, page, limit);
  }

  @Delete('notification/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a single notification by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @ApiResponse({ status: 400, description: 'Notification not found' })
  async deleteNotification(
    @Req() req: Request & { user: UserPayload },
    @Param('id') id: number,
  ) {
    return await this.userService.deleteNotification(req.user.id, id);
  }

  @Delete('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all notifications for the user' })
  @ApiResponse({ status: 200, description: 'All notifications deleted' })
  @ApiResponse({ status: 400, description: 'Notification not found' })
  async deleteAllNotifications(@Req() req: Request & { user: UserPayload }) {
    return await this.userService.deleteAllNotifications(req.user.id);
  }

  @Put('notifications/mark-all-read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read for the user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: Request & { user: UserPayload }) {
    return await this.userService.markAllAsRead(req.user.id);
  }

  @Put('notification/mark-read/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a single notification as read by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 400, description: 'Notification not found' })
  async markOneAsRead(
    @Req() req: Request & { user: UserPayload },
    @Param('id') id: number,
  ) {
    return await this.userService.markOneAsRead(req.user.id, id);
  }
}
