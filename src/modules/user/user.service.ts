import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Archive, ProjectCategory } from '../../entities/archive.entity';
import { createResponse } from 'src/utils/global/create-response';
import { User, UserRole, UserStatus } from 'src/entities/user.entity';
import { EditProfileDto } from './dto/edit-profile.dto';
import { Assignment } from 'src/entities/assignment.entity';
import {
  Project,
  ProjectStatus,
  ProposalStatus,
} from 'src/entities/project.entity';
import { FileType, ProjectFile } from 'src/entities/project-file.entity';
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

  async deleteUserAndAssociations(userId: number) {
    await this.userRepo.manager.transaction(async (mgr) => {
      await mgr.delete(Notification, { sendTo: userId });

      const projects = await mgr.find(Project, {
        where: { studentId: userId },
      });
      const projectIds = projects.map((p) => p.id);
      if (projectIds.length) {
        const files = await mgr.find(ProjectFile, {
          where: { projectId: In(projectIds) },
        });
        const urlsToDelete: string[] = [];
        for (const file of files) {
          if (file.filePath) {
            urlsToDelete.push(file.filePath);
          }
        }
        if (urlsToDelete.length > 0) {
          await this.cloudinaryProvider.deletePdfsFromCloud(urlsToDelete);
        }
        await mgr.delete(ProjectFile, { projectId: In(projectIds) });
        await mgr.delete(Project, { id: In(projectIds) });
      }

      await mgr.delete(Assignment, [
        { student: { id: userId } },
        { supervisor: { id: userId } },
      ]);
      await mgr.delete(User, { id: userId });
    });
  }

  async deleteUser(loggedInUser: number, userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.coordinator && userId !== loggedInUser) {
      throw new ForbiddenException(
        'You are not authorized to delete this user',
      );
    }
    await this.deleteUserAndAssociations(userId);
    return createResponse('User and all associated data deleted', {});
  }

  async getNotifications(userId: number, page: number = 1, limit: number = 10) {
    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: { sendTo: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return createResponse(
      notifications.length < 1
        ? 'No notifications found'
        : 'Notifications retrieved',
      {
        notifications,
        currentPage: page,
        totalNotifications: total,
        unreadCount,
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

  async markAllAsRead(userId: number) {
    const { affected } = await this.notificationRepo.update(
      { sendTo: userId, isRead: false },
      { isRead: true },
    );
    return createResponse(`${affected} notifications marked as read`, {});
  }

  async markOneAsRead(userId: number, notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, sendTo: userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.isRead) {
      return createResponse('Notification already marked as read', {});
    }
    notification.isRead = true;
    await this.notificationRepo.save(notification);
    return createResponse('Notification marked as read', {});
  }

  private async computeProjectMetrics(studentIds: number[]) {
    let approvedTopics = 0;
    let pendingTopics = 0;
    let rejectedTopics = 0;
    let proposalStage = 0;
    let chapter1_3Stage = 0;
    let chapter4_5Stage = 0;
    let completedStage = 0;

    if (studentIds.length > 0) {
      const projects = await this.projectRepo.find({
        where: { studentId: In(studentIds) },
        select: ['id', 'proposalStatus', 'projectStatus'],
      });
      const approvedProjects = projects.filter(
        (p) => p.proposalStatus === ProposalStatus.approved,
      );
      approvedTopics = approvedProjects.length;
      pendingTopics = projects.filter(
        (p) => p.proposalStatus === ProposalStatus.pending,
      ).length;
      rejectedTopics = projects.filter(
        (p) => p.proposalStatus === ProposalStatus.rejected,
      ).length;
      proposalStage = approvedProjects.filter(
        (p) => p.projectStatus === ProjectStatus.proposal,
      ).length;
      chapter1_3Stage = approvedProjects.filter(
        (p) => p.projectStatus === ProjectStatus.chapter1_3,
      ).length;
      chapter4_5Stage = approvedProjects.filter(
        (p) => p.projectStatus === ProjectStatus.chapter4_5,
      ).length;
      completedStage = approvedProjects.filter(
        (p) => p.projectStatus === ProjectStatus.completed,
      ).length;
    }

    return {
      proposalStatus: {
        approvedTopics,
        pendingTopics,
        rejectedTopics,
      },
      projectStatus: {
        proposalStage,
        chapter1_3Stage,
        chapter4_5Stage,
        completedStage,
      },
    };
  }

  private async getCoordinatorAnalytics(user: User) {
    const usersInTheDept = await this.userRepo.find({
      where: {
        department: { id: user.department.id },
      },
      select: ['id', 'role', 'status', 'isAssigned'],
    });
    const students = usersInTheDept.filter((u) => u.role === UserRole.student);
    const supervisors = usersInTheDept.filter(
      (u) => u.role === UserRole.supervisor,
    );
    const assignedStudents = students.filter((u) => u.isAssigned).length;
    const unassignedStudents = students.filter((u) => !u.isAssigned).length;
    const activeSupervisors = supervisors.filter(
      (s) => s.status === UserStatus.active,
    ).length;
    const inactiveSupervisors = supervisors.filter(
      (s) => s.status === UserStatus.inactive,
    ).length;
    // Get all students' ids in the department
    const studentIds = students.map((s) => s.id);
    const projectMetrics = await this.computeProjectMetrics(studentIds);

    return {
      students: students.length,
      supervisors: supervisors.length,
      assignedStudents,
      unassignedStudents,
      activeSupervisors,
      inactiveSupervisors,
      ...projectMetrics,
    };
  }

  private async getSupervisorAnalytics(user: User) {
    const assignments = await this.assignmentRepo.find({
      where: { supervisor: { id: user.id }, isActive: true },
      relations: ['student'],
    });
    const studentIds = assignments.map((a) => a.student.id);
    const projectMetrics = await this.computeProjectMetrics(studentIds);
    return {
      assignedStudents: studentIds.length,
      ...projectMetrics,
    };
  }

  private async getStudentAnalytics(user: User) {
    const projects = await this.projectRepo.find({
      where: { studentId: user.id },
    });
    const approvedTopic = projects.filter(
      (t) => t.proposalStatus === ProposalStatus.approved,
    );
    const pendingTopics = projects.filter(
      (t) => t.proposalStatus === ProposalStatus.pending,
    ).length;
    const rejectedTopics = projects.filter(
      (t) => t.proposalStatus === ProposalStatus.rejected,
    ).length;

    let totalFiles: ProjectFile[] = [];
    let submittedFiles = 0;
    let correctedFiles = 0;
    if (approvedTopic.length > 0) {
      totalFiles = await this.fileRepo.find({
        where: { projectId: approvedTopic[0].id },
      });
      submittedFiles = totalFiles.filter(
        (f) => f.type === FileType.submission,
      ).length;
      correctedFiles = totalFiles.filter(
        (f) => f.type === FileType.correction,
      ).length;
    }

    return {
      approvedTopic: approvedTopic.length,
      pendingTopics,
      rejectedTopics,
      submittedFiles,
      correctedFiles,
    };
  }

  async getUserAnalytics(userId: number) {
    const user = await this.findUserById(userId);
    let response: any = {};
    if (user.role === UserRole.coordinator) {
      response = await this.getCoordinatorAnalytics(user);
    } else if (user.role === UserRole.supervisor) {
      response = await this.getSupervisorAnalytics(user);
    } else if (user.role === UserRole.student) {
      response = await this.getStudentAnalytics(user);
    }
    return createResponse('User analytics retrieved', response);
  }
}
