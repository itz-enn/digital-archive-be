import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  STUDENT = 'STUDENT',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  fullName: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ unique: true, nullable: true })
  matricNumber: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ type: 'enum', enum: UserRole, nullable: false })
  role: UserRole;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  faculty: string;

  @Column({ nullable: true })
  superviseeLimit: number;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @CreateDateColumn({ nullable: false })
  updatedAt: Date;
}
