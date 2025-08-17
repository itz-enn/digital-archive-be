  import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive } from '../../entities/archive.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Archive)
    private readonly archiveRepository: Repository<Archive>,
  ) {}

  async getArchives(
    search: string,
    category: string,
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

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getArchiveById(id: number) {
    return this.archiveRepository.findOne({ where: { id } });
  }
}
