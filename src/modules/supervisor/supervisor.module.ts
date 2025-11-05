import { Module } from '@nestjs/common';
import { SupervisorService } from './supervisor.service';
import { SupervisorController } from './supervisor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/entities/project.entity';
import { Assignment } from 'src/entities/assignment.entity';
import { UserModule } from '../user/user.module';
import { StudentModule } from '../student/student.module';
import { Notification } from 'src/entities/notification.entity';
import { ProjectFile } from 'src/entities/project-file.entity';
import { CloudinaryProvider } from 'src/utils/provider/cloudinary.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Assignment, Notification, ProjectFile]),
    UserModule,
    StudentModule,
  ],
  providers: [SupervisorService, CloudinaryProvider],
  controllers: [SupervisorController],
  exports: [SupervisorService],
})
export class SupervisorModule {}
