import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Project, ProjectStatus } from 'src/entities/project.entity';
import { Repository, In, LessThan } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { ProjectFile } from 'src/entities/project-file.entity';
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

  // Deletes a user and all associated DB records and cloud files
  private async deleteUserAndAssociatedData(userId: number) {
    this.logger.log(`Starting deletion for user ${userId}`);
    await this.userRepo.manager.transaction(async (mgr) => {
      // 1) Delete notifications where user is recipient or initiator
      await mgr.delete(Notification, [
        { sendTo: userId },
        { initiatedBy: userId },
      ]);

      // 2) Find projects owned by user (student)
      const projects: Project[] = await mgr.find(Project, {
        where: { studentId: userId },
      });
      const projectIds = projects.map((p) => p.id);

      //TODO: better way to handle final file submission
      if (projectIds.length > 0) {
        // 3) Collect project files for Cloudinary deletion
        // Find all project files except the most recent submission (final project) for each project
        const files: ProjectFile[] = await mgr.find(ProjectFile, {
          where: { projectId: In(projectIds) },
          order: { uploadedAt: 'DESC' },
        });

        // Group files by projectId and exclude the most recent file for each project
        const filesToDelete: ProjectFile[] = [];
        const seenProjectIds = new Set<number>();
        for (const file of files) {
          if (!seenProjectIds.has(file.projectId)) {
            // Skip the most recent file for this project
            seenProjectIds.add(file.projectId);
            continue;
          }
          filesToDelete.push(file);
        }

        const urlsToDelete = filesToDelete.map((f) => f.filePath).filter(Boolean);

        if (urlsToDelete.length > 0) {
          try {
            await this.cloudinaryProvider.deletePdfsFromCloud(urlsToDelete);
            this.logger.log(
              `Deleted ${urlsToDelete.length} cloud files for user ${userId}`,
            );
          } catch (err) {
            this.logger.warn(
              `Cloudinary deletion failed for user ${userId}: ${err?.message || err}`,
            );
          }
        }

        // 4) Remove file records and projects
        try {
          await mgr.delete(ProjectFile, { projectId: In(projectIds) });
          await mgr.delete(Project, { id: In(projectIds) });
        } catch (err) {
          this.logger.warn(
            `Failed removing project/files for user ${userId}: ${err?.message || err}`,
          );
        }
      }

      // 5) Delete assignments where user is student or supervisor
      try {
        await mgr.delete(Assignment, [
          { student: { id: userId } },
          { supervisor: { id: userId } },
        ]);
      } catch (err) {
        this.logger.warn(
          `Failed deleting assignments for user ${userId}: ${err?.message || err}`,
        );
      }

      // 6) Finally delete the user record
      try {
        await mgr.delete(User, { id: userId });
      } catch (err) {
        this.logger.error(
          `Failed deleting user ${userId}: ${err?.message || err}`,
        );
        throw err; // rethrow to rollback transaction
      }
    });

    this.logger.log(`Completed deletion for user ${userId}`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteUser30daysAfterProjectCompleted() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completedProjects = await this.projectRepo.find({
      where: {
        projectStatus: ProjectStatus.completed,
        completedAt: LessThan(thirtyDaysAgo),
      },
      select: ['id', 'studentId', 'title', 'completedAt'],
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
          where: { projectId: project.id },
          order: { uploadedAt: 'DESC' },
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
          //TODO: come back for category, abstract, introduction
          const archive = this.archiveRepo.create({
            title: project.title,
            author: user.fullName,
            email: user.email,
            category: ProjectCategory.design,
            department: user.department?.name || '',
            supervisedBy: assignment?.supervisor?.fullName || '',
            year: project.completedAt?.getFullYear(),
            abstract: '',
            introduction: '',
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

    for (const userId of usersToDelete) {
      try {
        await this.deleteUserAndAssociatedData(userId);
      } catch (err) {
        this.logger.error(
          `Error deleting user ${userId}: ${err?.message || err}`,
        );
      }
    }
  }
}
