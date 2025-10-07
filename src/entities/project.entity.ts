import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProposalStatus {
  pending = 'pending',
  rejected = 'rejected',
  approved = 'approved',
}

export enum ProjectStatus {
  proposal = 'proposal',
  chapter1_2 = 'chapter1_2',
  chapter3_5 = 'chapter3_5',
  final = 'final',
  completed = 'completed',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  studentId: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  description: string;

  @Column({ nullable: true })
  review: string;

  @Column({ nullable: true })
  reviewer: string;

  @Column({
    type: 'enum',
    enum: ProposalStatus,
    default: ProposalStatus.pending,
    nullable: false,
  })
  proposalStatus: ProposalStatus;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.proposal,
    nullable: false,
  })
  projectStatus: ProjectStatus;

  @CreateDateColumn({ nullable: false })
  submittedAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
