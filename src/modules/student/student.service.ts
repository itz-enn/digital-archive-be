import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Project,
  ProjectStatus,
  ProposalStatus,
} from 'src/entities/project.entity';
import { createResponse } from 'src/utils/global/create-response';
import { SubmitTopicsDto, UpdateTopicDto } from './dto/topics.dto';
import { FileType, ProjectFile } from 'src/entities/project-file.entity';
import { CloudinaryProvider } from 'src/utils/provider/cloudinary.provider';
import * as path from 'path';
import * as fs from 'fs';
import { UserService } from '../user/user.service';
import { Assignment } from 'src/entities/assignment.entity';
import { NotificationCategory } from 'src/entities/notification.entity';
import { UpdateAbstractIntroDto } from './dto/update-abstract-intro.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(ProjectFile) private fileRepo: Repository<ProjectFile>,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,

    private readonly cloudinaryProvider: CloudinaryProvider,
    private readonly userService: UserService,
  ) {}

  async submitNewTopics(studentId: number, dto: SubmitTopicsDto) {
    const projects = dto.topics.map((topic) =>
      this.projectRepo.create({
        studentId,
        title: topic.title,
        description: topic.description,
        category: topic.category,
      }),
    );
    await this.projectRepo.save(projects);

    const assignment = await this.assignmentRepo.findOne({
      where: {
        student: { id: studentId },
        isActive: true,
      },
      relations: ['student', 'supervisor'],
    });

    if (assignment && assignment.supervisor) {
      this.userService.createNotification(
        `${assignment.student.fullName} has submitted ${projects.length} new project ${projects.length === 1 ? 'topic' : 'topics'}`,
        assignment.supervisor.id,
        NotificationCategory.topic_submission,
        studentId,
      );
    }

    return createResponse('Project topics submitted', {});
  }

  async updateTopic(studentId: number, topicId: number, dto: UpdateTopicDto) {
    const isAssigned = await this.assignmentRepo.findOne({
      where: {
        student: { id: studentId },
        isActive: true,
      },
      relations: ['student', 'supervisor'],
    });
    if (!isAssigned) {
      throw new BadRequestException('Student not assigned to any supervisor');
    }
    const topic = await this.projectRepo.findOne({
      where: { id: topicId, studentId },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (dto.title !== undefined) topic.title = dto.title;
    if (dto.description !== undefined) topic.description = dto.description;
    if (dto.category !== undefined) topic.category = dto.category;
    await this.projectRepo.save(topic);

    if (dto.title !== undefined) {
      this.userService.createNotification(
        `${isAssigned.student.fullName} has updated the project topic "${topic.title}" to "${dto.title}"`,
        isAssigned.supervisor.id,
        NotificationCategory.topic_update,
        studentId,
      );
    }
    return createResponse('Topic updated', topic);
  }

  async deleteTopic(studentId: number, topicId: number) {
    const topic = await this.projectRepo.findOne({
      where: { id: topicId, studentId },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (
      topic.proposalStatus !== ProposalStatus.pending &&
      topic.proposalStatus !== ProposalStatus.rejected
    ) {
      throw new BadRequestException(
        'Only topics with PENDING or REJECTED proposal status can be deleted',
      );
    }
    await this.projectRepo.remove(topic);
    return createResponse('Project topic deleted', {});
  }

  async uploadSubmissionFile(studentId: number, filePath: string) {
    let newPath: string | null = null;
    try {
      const isAssigned = await this.assignmentRepo.findOne({
        where: {
          student: { id: studentId },
          isActive: true,
        },
        relations: ['student', 'supervisor'],
      });
      if (!isAssigned) {
        throw new BadRequestException('Student not assigned to any supervisor');
      }
      const student = isAssigned.student;
      const project = await this.projectRepo.findOne({
        where: { studentId, proposalStatus: ProposalStatus.approved },
      });
      if (!project) throw new NotFoundException('Project not found');

      if (project.projectStatus === ProjectStatus.completed) {
        throw new BadRequestException(
          'Cannot upload files for a completed project',
        );
      }

      // Get latest file version
      const latestFile = await this.fileRepo.findOne({
        where: { projectId: project.id, type: FileType.submission },
        order: { version: 'DESC' },
      });
      const version = latestFile ? latestFile.version + 1 : 1;

      // Prepare filename
      const filename = `${student.institutionId.slice(-3)}_${
        project.projectStatus
      }_sub_v${version}${path.extname(filePath)}`;
      newPath = path.resolve(__dirname, `../../../uploads/${filename}`);
      await fs.promises.rename(filePath, newPath);
      const response =
        await this.cloudinaryProvider.uploadDocumentToCloud(newPath);

      // Save file record
      const projectFile = this.fileRepo.create({
        projectId: project.id,
        version,
        filePath: response.secure_url,
        fileSize: response.bytes,
        projectStage: project.projectStatus,
        type: FileType.submission,
      });
      await this.fileRepo.save(projectFile);

      this.userService.createNotification(
        `${student.fullName} has uploaded a new submission`,
        isAssigned.supervisor.id,
        NotificationCategory.file_upload,
        studentId,
      );

      return createResponse('File uploaded successfully', projectFile);
    } catch (error) {
      throw error;
    } finally {
      await fs.promises.unlink(filePath).catch(() => {}); // original temp file
      if (newPath) await fs.promises.unlink(newPath).catch(() => {});
    }
  }

  async previouslyUploadedFile(
    studentId: number,
    projectStage?: ProjectStatus,
    type?: FileType,
  ) {
    const project = await this.projectRepo.findOne({
      where: { studentId, proposalStatus: ProposalStatus.approved },
    });
    if (!project) throw new NotFoundException('Project not found');

    const where: any = { projectId: project.id };
    if (projectStage) {
      where.projectStage = projectStage;
    }
    if (type) {
      where.type = type;
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

  async updateAbstractAndIntro(studentId: number, dto: UpdateAbstractIntroDto) {
    const project = await this.projectRepo.findOne({
      where: { studentId, proposalStatus: ProposalStatus.approved },
    });
    if (!project) {
      throw new NotFoundException('Approved project not found');
    }
    if (project.projectStatus !== ProjectStatus.chapter4_5) {
      throw new BadRequestException(
        'Project must be in CHAPTER4_5 stage to update abstract/introduction',
      );
    }
    project.abstract = dto.abstract;
    project.introduction = dto.introduction;
    await this.projectRepo.save(project);
    return createResponse('Abstract and Introduction updated', {});
  }
}
