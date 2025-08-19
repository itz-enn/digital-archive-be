import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive } from '../../entities/archive.entity';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { createResponse } from 'src/utils/global/create-response';

@Injectable()
export class CoordinatorService {
  constructor(
    @InjectRepository(Archive)
    private readonly archiveRepo: Repository<Archive>,
  ) {}

  // DASHBOARD
  async getCoordinatorAnalytics() {}

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
