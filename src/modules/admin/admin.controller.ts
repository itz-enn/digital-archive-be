import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { AdminGuard } from 'src/utils/guards/admin.guard';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('archives')
  @ApiOperation({ summary: 'Creates a new archive' })
  @ApiResponse({ status: 200, description: 'Archive created' })
  async createArchive(@Body() dto: CreateArchiveDto) {
    return this.adminService.createArchive(dto);
  }

  @Put('archives/:id')
  @ApiOperation({ summary: 'Update an archive by id' })
  @ApiBody({ type: CreateArchiveDto })
  @ApiResponse({ status: 200, description: 'Archive updated' })
  @ApiResponse({ status: 400, description: 'Archive not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Archive ID' })
  async updateArchive(@Param('id') id: string, @Body() dto: UpdateArchiveDto) {
    return this.adminService.updateArchive(Number(id), dto);
  }

  @Delete('archives/:id')
  @ApiOperation({ summary: 'Delete an archive by id' })
  @ApiResponse({ status: 200, description: 'Archive deleted' })
  @ApiResponse({ status: 400, description: 'Archive not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Archive ID' })
  async deleteArchive(@Param('id') id: string) {
    return this.adminService.deleteArchive(Number(id));
  }
}
