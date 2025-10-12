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
import { UserService } from '../user/user.service';
import { Assignment } from 'src/entities/assignment.entity';
import { ReviewTopicsDto } from './dto/review-topics.dto';
import {
  Notification,
  NotificationCategory,
} from 'src/entities/notification.entity';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';

@Injectable()
export class SupervisorService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,

    private readonly userService: UserService,
  ) {}

  async assignedStudentsBySupervisor(supervisorId: number) {
    const assignedStudents = await this.assignmentRepo.query(
      `
    SELECT 
      a.id AS assignmentId,
      s.id AS studentId,
      s.fullName AS fullName,
      s.institutionId AS institutionId,
      s.email AS email,
      s.phone AS phone,
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'projectId', p.id,
            'projectTitle', p.title,
            'proposalStatus', p.proposalStatus,
            'projectStatus', p.projectStatus
          )
        ), JSON_ARRAY()
      ) AS projects
    FROM assignments a
    INNER JOIN users s ON a.studentId = s.id
    LEFT JOIN projects p ON p.studentId = s.id
    WHERE a.supervisorId = ?
      AND a.isActive = true
    GROUP BY a.id, s.id, s.fullName, s.institutionId, s.email, s.phone
    ORDER BY a.assignedAt ASC
    `,
      [supervisorId],
    );

    const students = assignedStudents.map((student) => {
      const projects = student.projects || [];
      const approved = projects.find((p) => p.proposalStatus === 'APPROVED');
      const rejected = projects
        .filter((p) => p.proposalStatus === 'REJECTED')
        .map((p) => p.projectTitle);

      return {
        assignmentId: student.assignmentId,
        studentId: student.studentId,
        fullName: student.fullName,
        institutionId: student.institutionId,
        email: student.email,
        phone: student.phone,
        projectStatus: approved ? approved.projectStatus : null,
        approvedTopic: approved ? approved.projectTitle : null,
        rejectedTopics: rejected,
      };
    });

    return createResponse(
      students.length < 1 ? 'No students assigned' : 'Students retrieved',
      students,
    );
  }

  // TOPIC APPROVAL
  async reviewTopics(loggedId: number, dto: ReviewTopicsDto) {
    const { topicId, status, review } = dto;
    const topic = await this.projectRepo.findOne({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Topic not found');

    // Check if the logged-in supervisor is assigned to the student
    const assignment = await this.assignmentRepo.findOne({
      where: {
        student: { id: topic.studentId },
        supervisor: { id: loggedId },
        isActive: true,
      },
    });
    if (!assignment)
      throw new NotFoundException('You are not assigned to this student');

    if (status === ProposalStatus.approved) {
      await this.projectRepo
        .createQueryBuilder()
        .update()
        .set({ proposalStatus: ProposalStatus.rejected })
        .where('studentId = :studentId', { studentId: topic.studentId })
        .andWhere('proposalStatus = :status', {
          status: ProposalStatus.approved,
        })
        .andWhere('id != :topicId', { topicId })
        .execute();
    }
    // Update status and review
    topic.proposalStatus = status;
    if (review?.trim()) {
      const reviewer = await this.userService.findUserById(loggedId);
      topic.review = review.trim();
      topic.reviewer = reviewer.fullName;
    }
    await this.projectRepo.save(topic);
    return createResponse('Topic reviewed successfully', topic);
  }

  async updateProjectStatus(
    loggedId: number,
    projectId: number,
    dto: UpdateProjectStatusDto,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
        proposalStatus: ProposalStatus.approved,
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    // Check if the logged-in supervisor is assigned to the student
    const assignment = await this.assignmentRepo.findOne({
      where: {
        student: { id: project.studentId },
        supervisor: { id: loggedId },
        isActive: true,
      },
    });
    if (!assignment)
      throw new NotFoundException('Unauthorized: Not assigned to this student');

    // Prevent moving to a previous stage
    const statusOrder = [
      ProjectStatus.proposal,
      ProjectStatus.chapter1_3,
      ProjectStatus.chapter4_5,
      ProjectStatus.completed,
    ];
    const currentIdx = statusOrder.indexOf(project.projectStatus);
    const newIdx = statusOrder.indexOf(dto.newStatus);

    if (newIdx <= currentIdx)
      throw new BadRequestException('Cannot move to previous or same stage');

    project.projectStatus = dto.newStatus;
    await this.projectRepo.save(project);

    return createResponse('Project status updated', project);
  }

  async sendNotificationToStudents(senderId: number, dto: SendNotificationDto) {
    const { studentIds, message } = dto;
    const notifications = studentIds.map((studentId) =>
      this.notificationRepo.create({
        sendTo: studentId,
        message,
        category: NotificationCategory.announcement,
        initiatedBy: senderId,
      }),
    );
    await this.notificationRepo.save(notifications);
    return createResponse('Notification sent', {});
  }

  async getSupervisorAnalytics(supervisorId: number) {
    // Total assigned students
    const totalStudents = await this.assignmentRepo.count({
      where: { supervisor: { id: supervisorId }, isActive: true },
    });

    //TODO
    // total files submitted

    // total
    // total proposal in pending status
    // total proposal in approved status
    // total projects in rejected status

    // number of student in each stage of project status
    // get each users approved topic and get recent Project Status

    return createResponse('Supervisor analytics retrieved', {
      totalStudents,
      // approvedTopics,
      // pendingTopics,
      // rejectedTopics,
    });
  }
}
