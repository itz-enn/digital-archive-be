import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectCategory {
  DESIGN = 'DESIGN',
  RESEARCH = 'RESEARCH',
}

@Entity('archives')
export class Archive {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  author: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'enum', enum: ProjectCategory, nullable: false })
  category: ProjectCategory;

  @Column({ nullable: false })
  department: string;

  @Column({ nullable: false })
  supervisedBy: string;

  @Column({ nullable: false })
  year: number;

  @Column('text', { nullable: false })
  abstract: string;

  @Column('text', { nullable: false })
  introduction: string;

  @Column({ nullable: false })
  filePath: string;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  archivedAt: Date;
}
