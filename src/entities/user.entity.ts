import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Department } from './department.entity';

export enum UserRole {
  admin = 'admin',
  coordinator = 'coordinator',
  supervisor = 'supervisor',
  student = 'student',
}

export enum UserStatus {
  active = 'active',
  inactive = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  fullName: string;

  @Column({ unique: true, nullable: false })
  institutionId: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: false, select: false })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole, nullable: false })
  role: UserRole;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({
    type: 'enum',
    enum: UserStatus,
    nullable: false,
    default: UserStatus.active,
  })
  status: UserStatus;

  // check if student is assigned
  @Column({ nullable: false, default: false })
  isAssigned: boolean;

  // value of max student for supervisor
  @Column({ type: 'int', nullable: true, default: 0 })
  maxStudents: number;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt: Date;
}
