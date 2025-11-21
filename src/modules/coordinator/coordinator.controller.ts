import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  PartialType,
  ApiConsumes,
} from '@nestjs/swagger';
import { CoordinatorService } from './coordinator.service';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { RoleGuard } from 'src/utils/guards/role.guard';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UserRole, UserStatus } from 'src/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserPayload } from 'express';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { StudentLimitDto } from './dto/student-limit.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xlsx from 'xlsx';

@ApiTags('coordinator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard(UserRole.coordinator))
@Controller('coordinator')
export class CoordinatorController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Post('create-user')
  @ApiOperation({ summary: 'Creates a user account (student or supervisor)' })
  @ApiResponse({ status: 200, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async createUserAccount(
    @Body() dto: CreateUserDto,
    @Req() req: Request & { user: UserPayload },
  ) {
    return await this.coordinatorService.createUserAccount(req.user.id, dto);
  }

  @Post('assign-students')
  @ApiOperation({ summary: 'Assign and reassign students to supervisors' })
  @ApiResponse({ status: 200, description: 'Students assigned' })
  @ApiResponse({ status: 400, description: 'Supervisor not found' })
  async assignStudents(@Body() dto: AssignStudentsDto) {
    return await this.coordinatorService.assignStudents(dto);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Students by default)' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  @ApiResponse({ status: 400, description: 'User not found' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'User role (Student by default)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query (name, email)',
  })
  @ApiQuery({
    name: 'isAssigned',
    required: false,
    type: Boolean,
    description: 'Filter by assigned/unassigned status (for students)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UserStatus,
    description: 'User status (for supervisor)',
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
    description: 'Number of results per page',
  })
  async getUsersByFilter(
    @Query('role') role: UserRole = UserRole.student,
    @Query('search') search: string,
    @Query('isAssigned') isAssigned: boolean,
    @Query('status') status: UserStatus,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: Request & { user: UserPayload },
  ) {
    return await this.coordinatorService.getUsersByFilter(
      req.user.id,
      role,
      search,
      isAssigned,
      status,
      page,
      limit,
    );
  }

  @Put('student-limit')
  @ApiOperation({ summary: 'Edit student limit for supervisors' })
  @ApiResponse({ status: 200, description: 'Max student limit updated' })
  @ApiResponse({ status: 400, description: 'Supervisor not found' })
  async editStudentLimit(@Body() dto: StudentLimitDto) {
    return await this.coordinatorService.editStudentLimit(dto);
  }

  @Post('archives')
  @ApiOperation({ summary: 'Creates a new archive' })
  @ApiResponse({ status: 200, description: 'Archive created' })
  async createArchive(@Body() dto: CreateArchiveDto) {
    return await this.coordinatorService.createArchive(dto);
  }

  @Put('archives/:id')
  @ApiOperation({ summary: 'Update an archive by id' })
  @ApiBody({ type: PartialType(CreateArchiveDto) })
  @ApiResponse({ status: 200, description: 'Archive updated' })
  @ApiResponse({ status: 400, description: 'Archive not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Archive ID' })
  async updateArchive(
    @Param('id') id: string,
    @Body() dto: Partial<CreateArchiveDto>,
  ) {
    return await this.coordinatorService.updateArchive(Number(id), dto);
  }

  @Delete('archives/:id')
  @ApiOperation({ summary: 'Delete an archive by id' })
  @ApiResponse({ status: 200, description: 'Archive deleted' })
  @ApiResponse({ status: 400, description: 'Archive not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Archive ID' })
  async deleteArchive(@Param('id') id: string) {
    return await this.coordinatorService.deleteArchive(Number(id));
  }

  @Post('bulk-create-user')
  @ApiOperation({
    summary:
      'Create user accounts in bulk from Excel file. Fields in the file should be fullName and institutionId',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Excel (.xlsx/.xls) file with columns fullName and institutionId',
        },
        role: {
          type: 'string',
          enum: Object.values(UserRole),
          description: 'Role for the created users (student or supervisor)',
        },
      },
      required: ['file', 'role'],
    },
  })
  @ApiResponse({ status: 200, description: 'Users created (summary returned)' })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(xls|xlsx)$/)) {
          return callback(
            new BadRequestException('Only Excel files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async bulkCreateAccount(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: UserPayload },
    @Body('role') role: UserRole,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);
    if (rows.length === 0) {
      throw new BadRequestException('Excel file is empty.');
    }
    const requiredColumns = ['fullName', 'institutionId'];
    const headers = Object.keys(rows[0]);
    const missing = requiredColumns.filter((col) => !headers.includes(col));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required columns: ${missing.join(', ')}`,
      );
    }
    console.log(rows);
    const dtos: CreateUserDto[] = rows.map((row) => ({
      fullName: row.fullName,
      institutionId: row.institutionId,
      role,
    }));

    return this.coordinatorService.bulkCreateAccount(
      req.user.id,
      dtos,
    );
  }
}
