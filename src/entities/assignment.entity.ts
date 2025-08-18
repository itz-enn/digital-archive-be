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

  //TODO make it a one to one thingy
  // when searching for student how will I display student details and also who the supervisor is
  @ManyToOne(() => User, (user) => user.id)
  supervisor: User;

  @ManyToOne(() => User, (user) => user.id)
  student: User;

  @Column({ type: 'int', default: 10 })
  student_limit: number;

  @CreateDateColumn({ type: 'timestamp' })
  assigned_at: Date;
}
