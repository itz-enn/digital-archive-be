import { Controller, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Archive } from '../../entities/archive.entity';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('archives')
  @ApiOperation({ summary: 'Creates a new archive' })
  @ApiResponse({ status: 201, description: 'Archive created.' })
  async createArchive(@Body() archiveData: Partial<Archive>) {
    return this.adminService.createArchive(archiveData);
  }

  @Put('archives/:id')
  @ApiOperation({ summary: 'Update an archive by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Archive updated.' })
  async updateArchive(
    @Param('id') id: string,
    @Body() archiveData: Partial<Archive>,
  ) {
    return this.adminService.updateArchive(Number(id), archiveData);
  }

  @Delete('archives/:id')
  @ApiOperation({ summary: 'Delete an archive by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Archive deleted.' })
  async deleteArchive(@Param('id') id: string) {
    return this.adminService.deleteArchive(Number(id));
  }
}
