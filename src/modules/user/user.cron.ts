import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Project, ProjectStatus } from 'src/entities/project.entity';
import { Repository, In, LessThan } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { FileType, ProjectFile } from 'src/entities/project-file.entity';
import { Assignment } from 'src/entities/assignment.entity';
import { Notification } from 'src/entities/notification.entity';
import { CloudinaryProvider } from 'src/utils/provider/cloudinary.provider';
import { Archive, ProjectCategory } from 'src/entities/archive.entity';

@Injectable()
export class UserCron {
  private readonly logger = new Logger(UserCron.name);

  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ProjectFile) private fileRepo: Repository<ProjectFile>,
    @InjectRepository(Archive) private archiveRepo: Repository<Archive>,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    private readonly cloudinaryProvider: CloudinaryProvider,
  ) {}

  // TODO: undo comment
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteUser30daysAfterProjectCompleted() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completedProjects = await this.projectRepo.find({
      where: {
        projectStatus: ProjectStatus.completed,
        completedAt: LessThan(thirtyDaysAgo),
      },
      select: [
        'id',
        'studentId',
        'title',
        'completedAt',
        'category',
        'abstract',
        'introduction',
      ],
    });

    if (!completedProjects || completedProjects.length === 0) {
      this.logger.log('No completed projects found.');
      return;
    }
    let usersToDelete: number[] = [];

    this.logger.log(
      `Starting archive for ${completedProjects.length} projects`,
    );
    let projectsArchived = 0;
    for (const project of completedProjects) {
      try {
        const lastFile = await this.fileRepo.findOne({
          where: {
            projectId: project.id,
            type: FileType.submission,
            isFinal: true,
          },
          select: ['filePath'],
        });

        if (lastFile) {
          const user = await this.userRepo.findOne({
            where: { id: project.studentId },
            select: ['fullName', 'email', 'department'],
            relations: ['department'],
          });
          const assignment = await this.assignmentRepo.findOne({
            where: { student: { id: project.studentId }, isActive: true },
            relations: ['supervisor'],
            select: ['supervisor'],
          });
          const archive = this.archiveRepo.create({
            title: project.title,
            author: user.fullName,
            email: user.email,
            category: project.category,
            department: user.department?.name || '',
            supervisedBy: assignment?.supervisor?.fullName || '',
            year: project.completedAt?.getFullYear(),
            abstract: project.abstract,
            introduction: project.introduction,
            filePath: lastFile.filePath,
          });
          await this.archiveRepo.save(archive);
          usersToDelete.push(project.studentId);
          projectsArchived++;
        }
      } catch (err) {}
    }
    this.logger.log(
      `Archived ${projectsArchived} projects out of ${completedProjects.length} completedProjects.`,
    );

    if (usersToDelete.length === 0) {
      this.logger.log('No users to delete.');
      return;
    }
    this.logger.log(`Starting deletion for ${usersToDelete.length} users.`);
    let deletedUsers = 0;
    for (const userId of usersToDelete) {
      try {
        const result = await this.deleteUserAndAssociatedData(userId);
        if (result) {
          deletedUsers++;
        }
      } catch (err) {}
    }
    this.logger.log(
      `Completed deletion for ${deletedUsers} out of ${usersToDelete.length} users.`,
    );
  }

  private async deleteUserAndAssociatedData(userId: number) {
    await this.userRepo.manager.transaction(async (mgr) => {
      await mgr.delete(Notification, [
        { sendTo: userId },
        { initiatedBy: userId },
      ]);

      const projects: Project[] = await mgr.find(Project, {
        where: { studentId: userId },
      });
      const projectIds = projects.map((p) => p.id);

      if (projectIds.length > 0) {
        const files = await mgr.find(ProjectFile, {
          where: { projectId: In(projectIds) },
        });
        if (files && files.length > 0) {
          let urlsToDelete: string[] = [];
          for (const file of files) {
            if (file.filePath && !file.isFinal) {
              urlsToDelete.push(file.filePath);
            }
          }
          try {
            await this.cloudinaryProvider.deletePdfsFromCloud(urlsToDelete);
          } catch (err) {
            this.logger.error(
              `Error deleting files from cloud for user ${userId}: ${err?.message || err}`,
            );
          }
          await mgr.delete(ProjectFile, { projectId: In(projectIds) });
        }
        await mgr.delete(Project, { id: In(projectIds) });
      }

      await mgr.delete(Assignment, [
        { student: { id: userId } },
        { supervisor: { id: userId } },
      ]);

      await mgr.delete(User, { id: userId });
    });

    return true;
  }
}
