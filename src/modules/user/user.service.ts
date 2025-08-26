import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive, ProjectCategory } from '../../entities/archive.entity';
import { createResponse } from 'src/utils/global/create-response';
import { User, UserRole } from 'src/entities/user.entity';
import { EditProfileDto } from './dto/edit-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Archive) private archiveRepo: Repository<Archive>,
  ) {}

  async findUserById(
    id: number,
    type: 'Student' | 'Supervisor' | 'User' = 'User',
  ): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!user) {
      throw new NotFoundException(`${type} not found`);
    }
    return user;
  }

  private async createNotification() {}

  // NOTIFICATIONS
  async getNotification() {}

  // PROFILE SETTING
  async getUserProfile(loggedInId: number, targetId: number) {
    const loggedInUser = await this.findUserById(loggedInId);
    const targetUser = await this.findUserById(targetId);

    if (loggedInUser.id !== targetUser.id) {
      const accessRules: Record<UserRole, UserRole[]> = {
        [UserRole.ADMIN]: [UserRole.COORDINATOR],
        [UserRole.COORDINATOR]: [UserRole.STUDENT, UserRole.SUPERVISOR],
        [UserRole.SUPERVISOR]: [],
        [UserRole.STUDENT]: [],
      };

      const allowedRoles = accessRules[loggedInUser.role] ?? [];
      if (!allowedRoles.includes(targetUser.role)) {
        throw new NotFoundException(
          `${loggedInUser.role} is not allowed to view ${targetUser.role} profile`,
        );
      }
    }
    return createResponse('User profile retrieved', {
      ...targetUser,
      department: targetUser.department?.name ?? null,
    });
  }

  async editProfile(id: number, dto: EditProfileDto) {
    const user = await this.findUserById(id);
    Object.assign(user, dto);
    await this.userRepo.save(user);
    return createResponse('User profile updated', {});
  }

  // SYSTEM PREFERENCES
  async getPreferences() {}

  async editPreferences() {}

  // ARCHIVE
  async getArchives(
    search: string,
    category: ProjectCategory,
    department: string,
    year: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const queryBuilder = this.archiveRepo.createQueryBuilder('archive');

    if (search) {
      queryBuilder.andWhere(
        '(archive.title LIKE :search OR archive.student_name LIKE :search OR archive.supervised_by LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('archive.category = :category', { category });
    }

    if (department) {
      queryBuilder.andWhere('archive.department = :department', { department });
    }

    if (year) {
      queryBuilder.andWhere('archive.year = :year', { year });
    }

    const [archives, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createResponse(
      total < 0 ? 'No archives found' : 'Archives retrieved',
      {
        archives,
        currentPage: page,
        totalArchives: total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    );
  }

  async getArchiveById(id: number) {
    const archive = await this.archiveRepo.findOne({ where: { id } });
    if (!archive) {
      throw new NotFoundException('Archive not found');
    }
    return createResponse('Archive retrieved', archive);
  }
}
