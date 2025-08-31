import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// TODO: verify all the enum properties
export enum ProposalStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
}

export enum ProjectStatus {
  PROPOSAL = 'PROPOSAL',
  CHAPTER1_2 = 'CHAPTER1_2',
  CHAPTER3_5 = 'CHAPTER3_5',
  FINAL = 'FINAL',
  COMPLETED = 'COMPLETED',
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
    default: ProposalStatus.PENDING,
    nullable: false,
  })
  proposalStatus: ProposalStatus;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PROPOSAL,
    nullable: false,
  })
  projectStatus: ProjectStatus;

  @CreateDateColumn({ nullable: false })
  submittedAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
