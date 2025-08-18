import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive, ProjectCategory } from '../../entities/archive.entity';
import { createResponse } from 'src/utils/global/create-response';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Archive)
    private readonly archiveRepository: Repository<Archive>,
  ) {}

  private async createNotification() {}

  // NOTIFICATIONS
  async getNotification() {}

  // PROFILE SETTING
  async editProfile() {}

  // SYSTEM PREFERENCES
  async getPreferences() {}

  async editPreferences() {}

  // ARCHIVE
  async getArchives(
    search: string,
    category: ProjectCategory,
    // department: string,
    year: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const queryBuilder = this.archiveRepository.createQueryBuilder('archive');

    if (search) {
      queryBuilder.andWhere(
        '(archive.title LIKE :search OR archive.student_name LIKE :search OR archive.supervised_by LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('archive.category = :category', { category });
    }

    if (year) {
      queryBuilder.andWhere('archive.year = :year', { year });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createResponse('Archives retrieved', {
      data,
      currentPage: page,
      totalArchives: total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }

  async getArchiveById(id: number) {
    const archive = await this.archiveRepository.findOne({ where: { id } });
    if (!archive) {
      throw new NotFoundException('Archive not found');
    }
    return createResponse('Archive retrieved', archive);
  }
}
