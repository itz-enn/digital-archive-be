import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from 'src/entities/project.entity';
import { createResponse } from 'src/utils/global/create-response';
import { SubmitTopicsDto } from './dto/submit-topics.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  // TOPIC SUBMISSION
  async submitNewTopics(studentId: number, dto: SubmitTopicsDto) {
    const projects = dto.topics.map((topic) =>
      this.projectRepo.create({
        studentId,
        title: topic.title,
        description: topic.description,
      }),
    );
    await this.projectRepo.save(projects);
    return createResponse('Project topics submitted', {});
  }

  async deleteTopic(studentId: number, topicId: number) {
    const topic = await this.projectRepo.findOne({
      where: { id: topicId, studentId },
    });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }
    if (topic.projectStatus !== ProjectStatus.PROPOSAL) {
      throw new NotFoundException(
        'Only topics in PROPOSAL stage can be deleted',
      );
    }
    await this.projectRepo.remove(topic);
    return createResponse('Project topic deleted', {});
  }

  // FILE UPLOAD
  async previouslyUploadedFile() {}

  async uploadFile() {}

  async deleteFile() {}

  async downloadFile() {}
}
