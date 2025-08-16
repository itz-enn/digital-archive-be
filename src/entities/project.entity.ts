// import { Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
// import { FileSubmission } from './file-submission.entity';
// import { ProjectTopic } from './project-topic.entity';

// @Entity('projects')
// export class Project {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @OneToMany(() => FileSubmission, (fileSubmission) => fileSubmission.project)
//   fileSubmissions: FileSubmission[];

//   @OneToMany(() => ProjectTopic, (projectTopic) => projectTopic.project)
//   projectTopics: ProjectTopic[];
// }
