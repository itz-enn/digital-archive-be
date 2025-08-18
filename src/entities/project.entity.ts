import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Column } from 'typeorm';
import { User } from './user.entity';
import { FileSubmission } from './file-submission.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  student: User;

  @Column({ type: 'float', default: 0 })
  progress: number;

  @OneToMany(() => FileSubmission, fileSubmission => fileSubmission.project)
  fileSubmissions: FileSubmission[];
}