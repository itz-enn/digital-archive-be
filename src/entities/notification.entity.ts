import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationCategory {
  announcement = 'announcement',
  project_review = 'project_review',
  status_update = 'status_update',
  topic_submission = 'topic_submission',
  file_upload = 'file_upload',
  student_assignment = 'student_assignment',
  topic_update = 'topic_update',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  message: string;

  @Column({ nullable: true })
  initiatedBy: number;

  @Column({ nullable: false })
  sendTo: number;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    nullable: false,
  })
  category: NotificationCategory;

  @Column({ nullable: false, default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
