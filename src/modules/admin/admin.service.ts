import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive } from '../../entities/archive.entity';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { createResponse } from 'src/utils/global/create-response';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Archive)
    private readonly archiveRepository: Repository<Archive>,
  ) {}

  // DASHBOARD
  async getAdminAnalytics() {}

  async getStatistics() {}

  // ASSIGNING SUPERVISORS
  async assignStudents() {}

  async bulkAssignStudents() {}

  async getSupervisors() {}

  async getUnassignedStudents() {}

  async csvTemplate() {}

  // MANAGING SUPERVISORS
  async getSupervisorDetails() {}

  async editStudentLimit() {}

  // SYSTEM STATISTICS
  async TODO() {}

  // ARCHIVE
  async createArchive(dto: CreateArchiveDto) {
    const archive = this.archiveRepository.create(dto);
    await this.archiveRepository.save(archive);
    return createResponse('Archive created', archive);
  }

  async updateArchive(id: number, dto: UpdateArchiveDto) {
    const archive = await this.archiveRepository.findOne({ where: { id } });
    if (!archive) {
      throw new NotFoundException('Archive not found');
    }
    Object.assign(archive, dto);
    const updatedArchive = await this.archiveRepository.save(archive);
    return createResponse('Archive updated', updatedArchive);
  }

  async deleteArchive(id: number) {
    const result = await this.archiveRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Archive not found');
    }
    return createResponse('Archive deleted', {});
  }
}