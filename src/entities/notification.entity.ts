import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationCategory {
  announcement = 'announcement',
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
