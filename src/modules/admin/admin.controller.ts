import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Get,
  UseGuards,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateCoordinatorDto } from './dto/create-coordinator.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UserRole } from 'src/entities/user.entity';
import { RoleGuard } from 'src/utils/guards/role.guard';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { UserPayload } from 'express';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard(UserRole.admin))
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Create a new coordinator' })
  @ApiResponse({ status: 200, description: 'Coordinator created.' })
  @ApiResponse({
    status: 400,
    description: 'Coordinator for this department already exists.',
  })
  @Post('coordinator')
  async createCoordinator(@Body() createCoordinatorDto: CreateCoordinatorDto) {
    return await this.adminService.createCoordinator(createCoordinatorDto);
  }

  @ApiOperation({ summary: 'Delete a coordinator' })
  @ApiResponse({ status: 200, description: 'Coordinator deleted.' })
  @ApiResponse({ status: 400, description: 'Coordinator not found.' })
  @ApiParam({ name: 'id', type: Number, description: 'Coordinator ID' })
  @Delete('coordinator/:id')
  async deleteCoordinator(@Param('id') id: number) {
    return await this.adminService.deleteCoordinator(id);
  }

  @ApiOperation({ summary: 'Get all coordinators' })
  @ApiResponse({ status: 200, description: 'Coordinator retrieved.' })
  @Get('coordinators')
  async getAllCoordinators() {
    return await this.adminService.getAllCoordinators();
  }

  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 200, description: 'Department created.' })
  @Post('department')
  async createDepartment(@Body() createDepartmentDto: CreateDepartmentDto) {
    return await this.adminService.createDepartment(createDepartmentDto);
  }

  @ApiOperation({ summary: 'Edit a department' })
  @ApiResponse({ status: 200, description: 'Department updated.' })
  @ApiResponse({ status: 400, description: 'Department not found.' })
  @ApiParam({ name: 'id', type: Number, description: 'Department ID' })
  @Put('department/:id')
  async editDepartment(
    @Param('id') id: number,
    @Body() dto: Partial<CreateDepartmentDto>,
  ) {
    return await this.adminService.editDepartment(id, dto);
  }

  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully.' })
  @ApiResponse({
    status: 400,
    description:
      'Cannot delete department: users are connected to this department.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Department ID' })
  @Delete('department/:id')
  async deleteDepartment(@Param('id') id: number) {
    return await this.adminService.deleteDepartment(id);
  }

  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200, description: 'List of all departments.' })
  @Get('departments')
  async getAllDepartments() {
    return await this.adminService.getAllDepartments();
  }
}
