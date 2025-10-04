import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createResponse } from 'src/utils/global/create-response';
import { Department } from 'src/entities/department.entity';
import { User, UserRole } from 'src/entities/user.entity';
import { CreateCoordinatorDto } from './dto/create-coordinator.dto';
import * as bcrypt from 'bcryptjs';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
  ) {}

  private async findDepartmentById(id: number) {
    const department = await this.deptRepo.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }

  async createCoordinator(dto: CreateCoordinatorDto) {
    if (
      await this.userRepo.findOne({
        where: {
          department: { id: dto.departmentId },
          role: UserRole.coordinator,
        },
      })
    ) {
      throw new NotFoundException(
        'Coordinator for this department already exists',
      );
    }
    const department = await this.findDepartmentById(dto.departmentId);

    const hashedPassword = await bcrypt.hash(dto.institutionId, 10);
    const coordinator = this.userRepo.create({
      ...dto,
      role: UserRole.coordinator,
      password: hashedPassword,
      department,
    });
    await this.userRepo.save(coordinator);
    return createResponse('Coordinator created', {
      ...coordinator,
      department: department?.name ?? null,
    });
  }

  async deleteCoordinator(id: number) {
    const result = await this.userRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Coordinator not found');
    return createResponse('Coordinator deleted', {});
  }

  async getAllCoordinators() {
    const coordinators = await this.userRepo.find({
      where: { role: UserRole.coordinator },
      relations: ['department'],
    });

    return createResponse(
      coordinators.length < 1
        ? 'No coordinator found'
        : 'Coordinators retrieved',
      {
        coordinators: coordinators.map((c) => ({
          ...c,
          department: c.department?.name ?? null,
        })),
      },
    );
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const department = this.deptRepo.create(dto);
    await this.deptRepo.save(department);
    return createResponse('Department created', department);
  }

  async editDepartment(id: number, dto: Partial<CreateDepartmentDto>) {
    const department = await this.findDepartmentById(id);
    Object.assign(department, dto);
    await this.deptRepo.save(department);
    return createResponse('Department updated', department);
  }

  async deleteDepartment(id: number) {
    const users = await this.userRepo.find({ where: { department: { id } } });
    if (users.length > 0) {
      throw new NotFoundException(
        'Cannot delete department: users are connected to this department',
      );
    }
    const result = await this.deptRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Department not found');
    return createResponse('Department deleted', {});
  }

  async getAllDepartments() {
    const departments = await this.deptRepo.find();
    return createResponse(
      departments.length < 1 ? 'No department found' : 'Department found',
      departments,
    );
  }
}
