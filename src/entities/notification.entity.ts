import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationCategory {
  system = 'system',
  user = 'user',
  project = 'project',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column()
  initiatedBy: number;

  @Column()
  sendTo: number;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    nullable: false,
  })
  category: NotificationCategory;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
