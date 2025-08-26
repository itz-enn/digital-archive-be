import {
  Controller,
  Get,
  Query,
  Param,
  Put,
  Req,
  Body,
  UseGuards,
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
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
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
}
