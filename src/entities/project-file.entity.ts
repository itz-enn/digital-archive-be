import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus } from './project.entity';

export enum FileStatus {
  reviewing = 'reviewing',
  reviewed = 'reviewed',
}

@Entity('project_files')
export class ProjectFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  projectId: number;

  @Column({ nullable: false })
  filePath: string;

  @Column({ nullable: false })
  fileSize: number;

  @Column({ nullable: false })
  version: number;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.reviewing,
    nullable: false,
  })
  status: FileStatus;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    nullable: false,
  })
  projectStage: ProjectStatus;

  @CreateDateColumn({ nullable: false })
  uploadedAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
