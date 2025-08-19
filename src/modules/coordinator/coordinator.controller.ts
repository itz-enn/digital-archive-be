import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CoordinatorService } from './coordinator.service';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { RoleGuard } from 'src/utils/guards/role.guard';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { UserRole } from 'src/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserPayload } from 'express';

@ApiTags('coordinator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard(UserRole.COORDINATOR))
@Controller('coordinator')
export class CoordinatorController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Post('create-user')
  @ApiResponse({ status: 200, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async register(
    @Body() dto: CreateUserDto,
    @Req() req: Request & { user: UserPayload },
  ) {
    const userId = req.user.id;
    return this.coordinatorService.createUserAccount(userId, dto);
  }

  @Post('archives')
  @ApiOperation({ summary: 'Creates a new archive' })
  @ApiResponse({ status: 200, description: 'Archive created' })
  async createArchive(@Body() dto: CreateArchiveDto) {
    return this.coordinatorService.createArchive(dto);
  }

  @Put('archives/:id')
  @ApiOperation({ summary: 'Update an archive by id' })
  @ApiBody({ type: CreateArchiveDto })
  @ApiResponse({ status: 200, description: 'Archive updated' })
  @ApiResponse({ status: 400, description: 'Archive not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Archive ID' })
  async updateArchive(@Param('id') id: string, @Body() dto: UpdateArchiveDto) {
    return this.coordinatorService.updateArchive(Number(id), dto);
  }

  @Delete('archives/:id')
  @ApiOperation({ summary: 'Delete an archive by id' })
  @ApiResponse({ status: 200, description: 'Archive deleted' })
  @ApiResponse({ status: 400, description: 'Archive not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Archive ID' })
  async deleteArchive(@Param('id') id: string) {
    return this.coordinatorService.deleteArchive(Number(id));
  }
}
