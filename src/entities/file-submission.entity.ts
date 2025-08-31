import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FileStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REVIEWING = 'REVIEWING',
  REVISED = 'REVISED',
}

@Entity('file_submissions')
export class FileSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(() => Project, (project) => project.fileSubmissions)
  // project: Project;

  @Column({ nullable: false })
  projectId: number;

  @Column({ nullable: false })
  fileName: string;

  @Column({ nullable: false })
  version: string;

  //TODO: should this be here???...don't think soooo
  @Column({ nullable: true })
  versionDescription: string;

  @Column({ nullable: false })
  filePath: string;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.PENDING,
    nullable: false,
  })
  status: FileStatus;

  // type: proposal

  @Column({ nullable: false, default: false })
  isLatest: boolean;

  @CreateDateColumn({ nullable: false })
  uploadedAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
