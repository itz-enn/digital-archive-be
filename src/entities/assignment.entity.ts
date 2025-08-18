import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { User } from './user.entity';

@Entity('assignemnts')
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id)
  supervisor: User;

  //TODO let instances be deleted if student is deleted
  @ManyToOne(() => User, (user) => user.id)
  student: User;

  @Column({ nullable: false, default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  assignedAt: Date;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt: Date;
}
