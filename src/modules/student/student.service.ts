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
import { UserRole } from 'src/entities/user.entity';
import { Assignment } from 'src/entities/assignment.entity';
import { NotificationCategory } from 'src/entities/notification.entity';

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
    const topic = await this.projectRepo.findOne({
      where: { id: topicId, studentId },
    });
    if (!topic) throw new NotFoundException('Topic not found');

    if (topic.proposalStatus !== ProposalStatus.pending)
      throw new BadRequestException('Only pending topics can be updated');

    if (dto.title !== undefined) topic.title = dto.title;
    if (dto.description !== undefined) topic.description = dto.description;

    await this.projectRepo.save(topic);
    return createResponse('Pending topic updated', topic);
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

  // FILE UPLOAD
  async uploadFile(uploaderId: number, projectId: number, filePath: string) {
    let newPath: string | null = null;
    try {
      const project = await this.projectRepo.findOne({
        where: { id: projectId, proposalStatus: ProposalStatus.approved },
      });
      if (!project) throw new NotFoundException('Project not found');
      const uploader = await this.userService.findUserById(uploaderId);
      const isSupervisor = uploader.role === UserRole.supervisor;

      if (!isSupervisor && uploader.id !== project.studentId) {
        throw new BadRequestException(
          'You are not authorized to upload files for this project',
        );
      }
      let studentInstitutionId = uploader.institutionId;
      // Check supervisor assignment
      // let supervisorId: number;
      if (isSupervisor) {
        const isAssignedStudent = await this.assignmentRepo.findOne({
          where: {
            student: { id: project.studentId },
            supervisor: { id: uploaderId },
            isActive: true,
          },
          relations: ['student', 'supervisor'],
        });
        if (!isAssignedStudent) {
          throw new BadRequestException('You are not assigned to this student');
        }
        studentInstitutionId = isAssignedStudent.student.institutionId;
        // supervisorId = isAssignedStudent.supervisor?.id;
      }
      const fileType = isSupervisor ? FileType.correction : FileType.submission;

      // Get latest file version
      const latestFile = await this.fileRepo.findOne({
        where: { projectId: project.id, type: fileType },
        order: { version: 'DESC' },
      });
      const version = latestFile ? latestFile.version + 1 : 1;

      // Prepare filename
      const filename = `${studentInstitutionId.slice(-3)}_${
        project.projectStatus
      }_${isSupervisor ? 'corr' : 'sub'}_v${version}${path.extname(filePath)}`;
      newPath = path.resolve(__dirname, `../../../uploads/${filename}`);

      // Rename (move) uploaded file before upload
      await fs.promises.rename(filePath, newPath);

      // Upload to Cloudinary
      const response =
        await this.cloudinaryProvider.uploadDocumentToCloud(newPath);

      // Save file record
      const projectFile = this.fileRepo.create({
        projectId: project.id,
        version,
        filePath: response.secure_url,
        fileSize: response.bytes,
        projectStage: project.projectStatus,
        type: fileType,
      });
      await this.fileRepo.save(projectFile);

      // console.log(supervisorId);
      // this.userService.createNotification(
      //   `${isSupervisor ? 'Supervisor has uploaded a new correction' : `${uploader.fullName} has uploaded a new submission`}`,
      //   isSupervisor ? project.studentId : supervisorId,
      //   NotificationCategory.file_upload,
      //   uploaderId,
      // );

      return createResponse('File uploaded successfully', projectFile);
    } catch (error) {
      // Handle all errors (e.g., project not found, upload failed, db error)
      throw error;
    } finally {
      // Always clean up both local temp and renamed file
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

  async getStudentAnalytics(studentId: number) {
    // Get all topics for the student in one query
    const projects = await this.projectRepo.find({ where: { studentId } });

    // Calculate counts in-memory
    const totalTopicsSubmitted = projects.length;
    const approvedTopics = projects.filter(
      (t) => t.proposalStatus === ProposalStatus.approved,
    ).length;
    const pendingTopics = projects.filter(
      (t) => t.proposalStatus === ProposalStatus.pending,
    ).length;
    const rejectedTopics = projects.filter(
      (t) => t.proposalStatus === ProposalStatus.rejected,
    ).length;

    // Total files uploaded
    let totalFiles = 0;
    const approvedProject = projects.find(
      (t) => t.proposalStatus === ProposalStatus.approved,
    );
    if (approvedProject) {
      totalFiles = await this.fileRepo.count({
        where: { projectId: approvedProject.id },
      });
    }

    return createResponse('Student analytics retrieved', {
      totalTopicsSubmitted,
      approvedTopics,
      pendingTopics,
      rejectedTopics,
      totalFiles,
    });
  }
}
