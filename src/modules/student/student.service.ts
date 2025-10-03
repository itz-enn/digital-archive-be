import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from 'src/entities/project.entity';
import { createResponse } from 'src/utils/global/create-response';
import { SubmitTopicsDto } from './dto/submit-topics.dto';
import {
  ProjectFile,
  FileStage,
  FileStatus,
} from 'src/entities/file-submission.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(ProjectFile) private fileRepo: Repository<ProjectFile>,
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
    return createResponse(200, true, 'Project topics submitted', {});
  }

  async deleteTopic(studentId: number, topicId: number) {
    const topic = await this.projectRepo.findOne({
      where: { id: topicId, studentId },
    });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }
    if (topic.projectStatus !== ProjectStatus.proposal) {
      throw new NotFoundException(
        'Only topics in PROPOSAL stage can be deleted',
      );
    }
    await this.projectRepo.remove(topic);
    return createResponse(200, true, 'Project topic deleted', {});
  }

  // FILE UPLOAD
  async previouslyUploadedFile() {}

  // async uploadFile(
  //   studentId: number,
  //   file: Express.Multer.File,
  //   dto: { projectId: number; fileStage: string; version: string },
  // ) {
  //   // Optionally: Validate project ownership
  //   const project = await this.projectRepo.findOne({
  //     where: { id: dto.projectId, studentId },
  //   });
  //   if (!project) throw new NotFoundException('Project not found');

  //   // Save file metadata to DB
  //   const projectFile = this.fileRepo.create({
  //     projectId: dto.projectId,
  //     fileName: file.originalname,
  //     version: dto.version,
  //     filePath: file.path, // Multer saves file and sets path
  //     fileSize: file.size.toString(),
  //     status: FileStatus.REVIEWING,
  //     fileStage: dto.fileStage as FileStage,
  //   });
  //   await this.fileRepo.save(projectFile);

  //   return createResponse(200, true, 'File uploaded successfully', projectFile);
  // }

  async deleteFile() {}

  async downloadFile() {}
}
