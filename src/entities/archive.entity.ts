import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('archives')
export class Archive {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  projectTitle: string;

  @Column()
  studentName: string;

  @Column({ nullable: false })
  departmentName: string;

  @Column({ nullable: false })
  supervisedBy: string;

  @Column({ nullable: false })
  year: number;

  @Column('text', { nullable: false })
  abstract: string;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  archivedAt: Date;
}
