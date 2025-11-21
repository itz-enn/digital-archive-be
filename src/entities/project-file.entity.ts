import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus } from './project.entity';

export enum FileType {
  submission = 'submission',
  correction = 'correction',
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
    enum: FileType,
    default: FileType.submission,
    nullable: true,
  })
  type: FileType;

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
