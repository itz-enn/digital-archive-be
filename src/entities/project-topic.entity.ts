// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
// } from 'typeorm';
// import { Project } from './project.entity';

// @Entity('project_topics')
// export class ProjectTopic {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @ManyToOne(() => Project, (project) => project.projectTopics)
//   project: Project;

//   @Column()
//   title: string;

//   @Column('text')
//   description: string;

//   @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'] })
//   status: 'pending' | 'approved' | 'rejected';

//   @CreateDateColumn({ type: 'timestamp' })
//   created_at: Date;
// }
