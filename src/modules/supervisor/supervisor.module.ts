import { Module } from '@nestjs/common';
import { SupervisorService } from './supervisor.service';
import { SupervisorController } from './supervisor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/entities/project.entity';
import { Assignment } from 'src/entities/assignment.entity';
import { UserModule } from '../user/user.module';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Assignment]),
    UserModule,
    StudentModule,
  ],
  providers: [SupervisorService],
  controllers: [SupervisorController],
  exports: [SupervisorService],
})
export class SupervisorModule {}
