import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('file_submissions')
export class FileSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, project => project.fileSubmissions)
  project: Project;

  @Column()
  file_name: string;

  @Column()
  file_path: string;

  @Column()
  version: string;

  @Column()
  version_description: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'reviewing', 'revision'] })
  status: 'pending' | 'approved' | 'reviewing' | 'revision';

  @Column({ default: false })
  is_latest: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  uploaded_at: Date;
}