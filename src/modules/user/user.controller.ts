import { Controller, Get, Query, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
    required: false,
    description: 'Category name',
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
    @Query('category') category?: string,
    @Query('year') year?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.getArchives(search, category, year, page, limit);
  }

  @Get('archive/:id')
  @ApiOperation({ summary: 'Get info about a single archive by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Archive ID' })
  @ApiResponse({
    status: 200,
    description: 'Archive retrieved ',
  })
  @ApiResponse({ status: 400, description: 'Archive not found' })
  async getArchiveById(@Param('id') id: string) {
    return this.userService.getArchiveById(Number(id));
  }
}
