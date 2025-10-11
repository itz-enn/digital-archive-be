import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive, ProjectCategory } from '../../entities/archive.entity';
import { createResponse } from 'src/utils/global/create-response';
import { User, UserRole } from 'src/entities/user.entity';
import { EditProfileDto } from './dto/edit-profile.dto';
import { Assignment } from 'src/entities/assignment.entity';
import { Project, ProposalStatus } from 'src/entities/project.entity';
import { ProjectFile } from 'src/entities/project-file.entity';
import { CloudinaryProvider } from 'src/utils/provider/cloudinary.provider';
import {
  Notification,
  NotificationCategory,
} from 'src/entities/notification.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Archive) private archiveRepo: Repository<Archive>,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(ProjectFile) private fileRepo: Repository<ProjectFile>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,

    private readonly cloudinaryProvider: CloudinaryProvider,
  ) {}

  async findUserById(
    id: number,
    type: 'Student' | 'Supervisor' | 'User' = 'User',
  ): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!user) throw new NotFoundException(`${type} not found`);
    return user;
  }

  async createNotification(
    message: string,
    sendTo: number,
    category: NotificationCategory,
    initiatedBy?: number,
  ) {
    const notification = this.notificationRepo.create({
      sendTo,
      message: message.trim(),
      category,
      initiatedBy: initiatedBy || null,
    });
    await this.notificationRepo.save(notification);
    return notification;
  }

  // PROFILE SETTING
  async getUserProfile(loggedInId: number, targetId: number) {
    const loggedInUser = await this.findUserById(loggedInId);
    const targetUser = await this.findUserById(targetId);

    if (loggedInUser.id !== targetUser.id) {
      const accessRules: Record<UserRole, UserRole[]> = {
        [UserRole.admin]: [UserRole.coordinator],
        [UserRole.coordinator]: [UserRole.student, UserRole.supervisor],
        [UserRole.supervisor]: [],
        [UserRole.student]: [],
      };

      const allowedRoles = accessRules[loggedInUser.role] ?? [];
      if (!allowedRoles.includes(targetUser.role)) {
        throw new NotFoundException(
          `${loggedInUser.role} is not allowed to view ${targetUser.role} profile`,
        );
      }
    }

    let studentExtras = null;
    if (targetUser.role === UserRole.student) {
      // Get approved topic
      const approvedProject = await this.projectRepo.findOne({
        where: {
          studentId: targetUser.id,
          proposalStatus: ProposalStatus.approved,
        },
      });
      // Get supervisor (active assignment)
      const assignment = await this.assignmentRepo.findOne({
        where: { student: { id: targetUser.id }, isActive: true },
        relations: ['supervisor'],
      });

      studentExtras = {
        project: approvedProject
          ? {
              approvedTopic: approvedProject?.title,
              projectStatus: approvedProject?.projectStatus,
            }
          : null,
        supervisorName: assignment?.supervisor.fullName ?? null,
      };
    }

    const user = {
      ...targetUser,
      department: targetUser.department?.name ?? null,
    };
    return createResponse(
      'User profile retrieved',
      targetUser.role === UserRole.student
        ? { ...user, ...studentExtras }
        : { ...user },
    );
  }

  async editProfile(id: number, dto: EditProfileDto) {
    const user = await this.findUserById(id);
    Object.assign(user, dto);
    await this.userRepo.save(user);
    return createResponse('User profile updated', {});
  }

  async getSubmittedTopics(loggedInUserId: number, studentId: number) {
    const assignment = await this.assignmentRepo.findOne({
      where: { student: { id: studentId }, isActive: true },
      relations: ['supervisor'],
    });

    // Authorization check:
    const isStudent = loggedInUserId === studentId;
    const isSupervisor =
      assignment && loggedInUserId === assignment.supervisor.id;
    if (!isStudent && !isSupervisor) {
      throw new ForbiddenException(
        'You are not authorized to view these topics',
      );
    }
    const projects = await this.projectRepo.find({
      where: { studentId },
      order: { submittedAt: 'DESC' },
    });

    return createResponse(
      projects.length < 1
        ? 'No topics submitted'
        : 'Submitted topics retrieved',
      projects,
    );
  }

  // ARCHIVE
  async getArchives(
    search: string,
    category: ProjectCategory,
    department: string,
    year: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const queryBuilder = this.archiveRepo.createQueryBuilder('archive');

    if (search) {
      queryBuilder.andWhere(
        '(archive.title LIKE :search OR archive.author LIKE :search OR archive.supervisedBy LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('archive.category = :category', { category });
    }

    if (department) {
      queryBuilder.andWhere('archive.department = :department', { department });
    }

    if (year) {
      queryBuilder.andWhere('archive.year = :year', { year });
    }

    const [archives, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createResponse(
      total < 0 ? 'No archives found' : 'Archives retrieved',
      {
        archives,
        currentPage: page,
        totalArchives: total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    );
  }

  async getArchiveById(id: number) {
    const archive = await this.archiveRepo.findOne({ where: { id } });
    if (!archive) {
      throw new NotFoundException('Archive not found');
    }
    return createResponse('Archive retrieved', archive);
  }

  //TODO: test this endpoint
  async deleteUserAndAssociations(loggedInUser: number, userId: number) {
    // Find user
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.coordinator && userId !== loggedInUser) {
      throw new ForbiddenException(
        'You are not authorized to delete this user',
      );
    }

    // Delete notifications where sendTo is equal to userId
    const notifications = await this.notificationRepo.find({
      where: { sendTo: userId },
    });
    if (notifications.length > 0) {
      await this.notificationRepo.remove(notifications);
    }

    const project = await this.projectRepo.findOne({
      where: { studentId: userId },
    });
    if (project) {
      const files = await this.fileRepo.find({
        where: { projectId: project.id },
      });

      if (files.length > 0) {
        let urlsToDelete: string[] = [];
        for (const file of files) {
          if (file.filePath) {
            urlsToDelete.push(file.filePath);
          }
          await this.fileRepo.remove(file);
        }
        if (urlsToDelete.length > 0) {
          await this.cloudinaryProvider.deletePdfsFromCloud(urlsToDelete);
        }
      }

      await this.projectRepo.remove(project);
    }

    // Delete assignments (as student or supervisor)
    const assignments = await this.assignmentRepo.find({
      where: [{ student: { id: userId } }, { supervisor: { id: userId } }],
    });
    if (assignments.length > 0) {
      await this.assignmentRepo.remove(assignments);
    }

    await this.userRepo.delete(userId);
    return createResponse('User and all associated data deleted', {});
  }

  async getAndMarkNotifications(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: { sendTo: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Mark all as read
    if (notifications.length > 0) {
      await this.notificationRepo.update(
        { sendTo: userId, isRead: false },
        { isRead: true },
      );
    }

    return createResponse(
      notifications.length < 1
        ? 'No notifications found'
        : 'Notifications retrieved',
      {
        notifications,
        currentPage: page,
        totalNotifications: total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    );
  }

  async deleteNotification(userId: number, notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, sendTo: userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.notificationRepo.remove(notification);
    return createResponse('Notification deleted', {});
  }

  async deleteAllNotifications(userId: number) {
    const notifications = await this.notificationRepo.find({
      where: { sendTo: userId },
    });
    if (notifications.length < 1)
      throw new NotFoundException('No notifications found');
    await this.notificationRepo.remove(notifications);
    return createResponse('All notifications deleted', {});
  }
}
