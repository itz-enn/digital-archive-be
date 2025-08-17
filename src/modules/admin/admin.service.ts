import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive } from '../../entities/archive.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Archive)
    private readonly archiveRepository: Repository<Archive>,
  ) {}

  async createArchive(archiveData: Partial<Archive>) {
    const archive = this.archiveRepository.create(archiveData);
    return this.archiveRepository.save(archive);
  }

  async updateArchive(id: number, archiveData: Partial<Archive>) {
    await this.archiveRepository.update(id, archiveData);
    return this.archiveRepository.findOne({ where: { id } });
  }

  async deleteArchive(id: number) {
    await this.archiveRepository.delete(id);
    return { deleted: true };
  }
}
