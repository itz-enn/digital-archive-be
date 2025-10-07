import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from 'src/entities/project.entity';
import { createResponse } from 'src/utils/global/create-response';
import { SubmitTopicsDto } from './dto/submit-topics.dto';
import { ProjectFile, FileStatus } from 'src/entities/project-file';
import { CloudinaryProvider } from 'src/utils/provider/cloudinary.provider';
import * as path from 'path';
import * as fs from 'fs';
import { UserService } from '../user/user.service';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(ProjectFile) private fileRepo: Repository<ProjectFile>,

    private readonly cloudinaryProvider: CloudinaryProvider,
    private readonly userService: UserService,
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
    if (!topic) throw new NotFoundException('Topic not found');

    if (topic.projectStatus !== ProjectStatus.proposal)
      throw new NotFoundException(
        'Only topics in PROPOSAL stage can be deleted',
      );
    await this.projectRepo.remove(topic);
    return createResponse('Project topic deleted', {});
  }

  // FILE UPLOAD
  async uploadFile(studentId: number, filePath: string) {
    const user = await this.userService.findUserById(studentId, 'Student');
    const project = await this.projectRepo.findOne({
      where: { id: studentId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const latestFile = await this.fileRepo.findOne({
      where: { projectId: project.id },
      order: { version: 'DESC' },
    });
    const version = latestFile ? latestFile.version + 1 : 1;

    const filename = `${user.institutionId.slice(
      -3,
    )}_${project.projectStatus}_v${version}${path.extname(filePath)}`;
    const newPath = path.resolve(__dirname, `../../../uploads/${filename}`);
    await fs.promises.rename(filePath, newPath);

    let response;
    try {
      response = await this.cloudinaryProvider.uploadDocumentToCloud(newPath);
    } finally {
      // Ensure cleanup even if upload fails
      await fs.promises.unlink(newPath).catch(() => {});
    }

    const projectFile = this.fileRepo.create({
      projectId: project.id,
      version,
      filePath: response.secure_url,
      fileSize: response.bytes,
      status: FileStatus.reviewing,
      projectStage: project.projectStatus,
    });
    await this.fileRepo.save(projectFile);

    return createResponse('File uploaded successfully', projectFile);
  }

  async previouslyUploadedFile(
    studentId: number,
    projectStage?: ProjectStatus,
  ) {
    const project = await this.projectRepo.findOne({ where: { studentId } });
    //TODO: handle no project case
    //TODO: finOneProject as a single function

    const where: any = { projectId: project.id };
    if (projectStage) {
      where.projectStage = projectStage;
    }
    const files = await this.fileRepo.find({ where });

    return createResponse(
      files.length < 1 ? 'No uploaded files found' : 'Uploaded files retrieved',
      files,
    );
  }

  async deleteFile(studentId: number, fileId: number) {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    // Ensure the student owns the project/file
    const project = await this.projectRepo.findOne({
      where: { id: file.projectId, studentId },
    });
    if (!project)
      throw new NotFoundException('You are not authorized to delete this file');

    // Delete from Cloudinary (if stored there)
    if (file.filePath && file.filePath.startsWith('http')) {
      await this.cloudinaryProvider
        .deletePdfsFromCloud([file.filePath])
        .catch(() => {});
    }

    await this.fileRepo.remove(file);
    return createResponse('File deleted successfully', {});
  }
}
