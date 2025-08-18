import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('project_topics')
export class ProjectTopic {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  student: User;

  @ManyToOne(() => User)
  supervisor: User;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'] })
  status: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn({ type: 'timestamp' })
  submitted_at: Date;
}