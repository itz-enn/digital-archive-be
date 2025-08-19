import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive } from '../../entities/archive.entity';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { createResponse } from 'src/utils/global/create-response';
import { User } from 'src/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { Assignment } from 'src/entities/assignment.entity';
import { ReassignStudentDto } from './dto/reassign-student.dto copy';

@Injectable()
export class CoordinatorService {
  constructor(
    @InjectRepository(Archive) private archiveRepo: Repository<Archive>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
  ) {}

  private async findUserById(
    id: number,
    type: 'Student' | 'Supervisor' | 'User' = 'User',
  ): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`${type} not found`);
    }
    return user;
  }

  // DASHBOARD
  async createUserAccount(id: number, dto: CreateUserDto) {
    const existingUser = await this.userRepo.findOne({
      where: { institutionId: dto.institutionId },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    const { department } = await this.findUserById(id);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      department,
    });
    await this.userRepo.save(user);

    delete user.password;

    return createResponse('User created successfully', { user });
  }

  async getCoordinatorAnalytics() {}

  async getStatistics() {}

  // ASSIGNING SUPERVISORS
  async assignStudents(dto: AssignStudentsDto) {
    const supervisor = await this.findUserById(dto.supervisorId, 'Supervisor');

    const assignmentsToSave: Assignment[] = [];
    const assignedStudents: User[] = [];

    for (const matric of dto.studentInstitutionIds) {
      const student = await this.userRepo.findOne({
        where: { institutionId: matric, isAssigned: false },
      });

      if (!student) {
        continue;
      }

      const assignment = this.assignmentRepo.create({
        supervisor,
        student,
      });

      assignmentsToSave.push(assignment);
      student.isAssigned = true;
      await this.userRepo.save(student);

      assignedStudents.push(student);
    }
    // save all new assignments at once
    await this.assignmentRepo.save(assignmentsToSave);
    // TODO: what should I return
    return createResponse('Students assigned', {});
  }

  async changeStudentAssignment(dto: ReassignStudentDto) {
    const student = await this.findUserById(dto.studentId, 'Student');

    const currentAssignment = await this.assignmentRepo.findOne({
      where: { student: { id: student.id }, isActive: true },
    });
    if (!currentAssignment) {
      throw new NotFoundException('Current assignment not found');
    }

    const supervisor = await this.findUserById(dto.supervisorId, 'Supervisor');
    const newAssignment = this.assignmentRepo.create({
      supervisor,
      student,
    });
    await this.assignmentRepo.save(newAssignment);

    currentAssignment.isActive = false;
    await this.assignmentRepo.save(currentAssignment);

    return createResponse('Student reassigned', {});
  }

  async getSupervisors() {}

  async getAllStudents() {}

  // MANAGING SUPERVISORS
  async getSupervisorDetails() {}

  async editStudentLimit(supervisorId: number, newLimit: number) {
    const supervisor = await this.findUserById(supervisorId, 'Supervisor');
    if (newLimit < 0) {
      throw new ConflictException('Student limit cannot be negative');
    }
    supervisor.maxStudents = newLimit;
    await this.userRepo.save(supervisor);
    return createResponse('Student limit updated', {});
  }

  // SYSTEM STATISTICS
  async TODO() {}

  // ARCHIVE
  async createArchive(dto: CreateArchiveDto) {
    const archive = this.archiveRepo.create(dto);
    await this.archiveRepo.save(archive);
    return createResponse('Archive created', archive);
  }

  async updateArchive(id: number, dto: UpdateArchiveDto) {
    const archive = await this.archiveRepo.findOne({ where: { id } });
    if (!archive) {
      throw new NotFoundException('Archive not found');
    }
    Object.assign(archive, dto);
    const updatedArchive = await this.archiveRepo.save(archive);
    return createResponse('Archive updated', updatedArchive);
  }

  async deleteArchive(id: number) {
    const result = await this.archiveRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Archive not found');
    }
    return createResponse('Archive deleted', {});
  }
}
