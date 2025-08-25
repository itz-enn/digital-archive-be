import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  supervisor: User;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  student: User;

  @Column({ nullable: false, default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  assignedAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt: Date;
}
