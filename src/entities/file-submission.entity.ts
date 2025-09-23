import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FileStatus {
  //TODO: delete this later
  //   pending = 'pending',
  approved = 'approved',
  reviewing = 'reviewing',
  // revised = 'revised',
}

export enum FileStage {
  proposal = 'proposal',
  chapter = 'chapter',
  final_report = 'final_report',
}

@Entity('project_files')
export class ProjectFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  projectId: number;

  @Column({ nullable: false })
  fileName: string;

  @Column({ nullable: false })
  version: string;

  @Column({ nullable: false })
  filePath: string;

  //TODO: i'll see how this goessss
  @Column({ nullable: false })
  fileSize: string;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.reviewing,
    nullable: false,
  })
  status: FileStatus;

  @Column({
    type: 'enum',
    enum: FileStage,
    nullable: false,
  })
  fileStage: FileStage;

  @CreateDateColumn({ nullable: false })
  uploadedAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
