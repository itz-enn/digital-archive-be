import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive } from '../../entities/archive.entity';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { createResponse } from 'src/utils/global/create-response';
import { User, UserRole, UserStatus } from 'src/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { Assignment } from 'src/entities/assignment.entity';
import { StudentLimitDto } from './dto/student-limit.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class CoordinatorService {
  constructor(
    @InjectRepository(Archive) private archiveRepo: Repository<Archive>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,

    private readonly userService: UserService,
  ) {}

  // DASHBOARD
  async createUserAccount(id: number, dto: CreateUserDto) {
    const existingUser = await this.userRepo.findOne({
      where: { institutionId: dto.institutionId },
    });
    if (existingUser) throw new ConflictException('User already exists');
    const { department } = await this.userService.findUserById(id);

    const hashedPassword = await bcrypt.hash(dto.institutionId, 10);
    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      department,
    });
    await this.userRepo.save(user);

    delete user.password;

    return createResponse('User created successfully', {
      ...user,
      department: department?.name ?? null,
    });
  }

  // ASSIGNING SUPERVISORS
  async assignStudents(dto: AssignStudentsDto) {
    const supervisor = await this.userService.findUserById(
      dto.supervisorId,
      'Supervisor',
    );
    // Count currently assigned students plus the new ones to be assigned
    const activeCount = await this.assignmentRepo.count({
      where: { supervisor: { id: supervisor.id }, isActive: true },
    });
    if (
      activeCount + dto.studentInstitutionIds.length >
      supervisor.maxStudents
    ) {
      throw new BadRequestException(
        `Supervisor can only take ${supervisor.maxStudents - activeCount} more students (limit: ${supervisor.maxStudents})`,
      );
    }
    const assignmentsToSave: Assignment[] = [];
    const assignedStudents: string[] = [];

    for (const institutionId of dto.studentInstitutionIds) {
      const student = await this.userRepo.findOne({ where: { institutionId } });
      if (!student) continue;

      if (student.isAssigned) {
        //check if user is assigned is true and if there's an existing assignment
        const existingAssignment = await this.assignmentRepo.findOne({
          where: { student: { id: student.id }, isActive: true },
          relations: ['supervisor'],
        });
        if (existingAssignment) {
          if (existingAssignment.supervisor.id === supervisor.id) {
            // skip if user is already assigned to this supervisor
            continue;
          } else {
            // deactivate old supervisor assignment
            existingAssignment.isActive = false;
            await this.assignmentRepo.save(existingAssignment);
          }
        }
      }

      const newAssignment = this.assignmentRepo.create({
        supervisor,
        student,
        isActive: true,
      });
      assignmentsToSave.push(newAssignment);
      student.isAssigned = true;
      await this.userRepo.save(student);
      assignedStudents.push(student.institutionId);
    }
    // save all new assignments at once
    if (assignmentsToSave.length > 0)
      await this.assignmentRepo.save(assignmentsToSave);
    return createResponse('Students assigned', assignedStudents);
  }

  async getUsersByFilter(
    id: number,
    role: UserRole,
    search?: string,
    isAssigned?: boolean,
    status?: UserStatus,
    page: number = 1,
    limit: number = 10,
  ) {
    const user = await this.userService.findUserById(id);
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .where('user.role = :role', { role })
      .andWhere('user.departmentId = :deptId', {
        deptId: user.department.id,
      });

    // Search filter
    if (search) {
      query.andWhere(
        '(user.fullName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (typeof isAssigned === 'boolean') {
      query.andWhere('user.isAssigned = :isAssigned', { isAssigned });
    }

    // Filter by status (Active / Inactive)
    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    // Pagination
    const [users, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createResponse(total < 0 ? 'No user found' : 'Users retrieved', {
      users: users.map((u) => ({
        ...u,
        department: u.department?.name ?? null,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }

  // MANAGING SUPERVISORS
  async editStudentLimit(dto: StudentLimitDto) {
    const supervisor = await this.userService.findUserById(
      dto.supervisorId,
      'Supervisor',
    );
    if (dto.maxStudents < 0)
      throw new ConflictException('Student limit cannot be negative');

    supervisor.maxStudents = dto.maxStudents;
    await this.userRepo.save(supervisor);
    return createResponse('Max student limit updated', {});
  }

  // ARCHIVE
  async createArchive(dto: CreateArchiveDto) {
    const archive = this.archiveRepo.create(dto);
    await this.archiveRepo.save(archive);
    return createResponse('Archive created', archive);
  }

  async updateArchive(id: number, dto: Partial<CreateArchiveDto>) {
    const archive = await this.archiveRepo.findOne({ where: { id } });
    if (!archive) throw new NotFoundException('Archive not found');
    Object.assign(archive, dto);
    const updatedArchive = await this.archiveRepo.save(archive);
    return createResponse('Archive updated', updatedArchive);
  }

  async deleteArchive(id: number) {
    const result = await this.archiveRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Archive not found');
    return createResponse('Archive deleted', {});
  }
}
