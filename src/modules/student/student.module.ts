import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/entities/project.entity';
import { ProjectFile } from 'src/entities/file-submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectFile])],
  providers: [StudentService],
  controllers: [StudentController],
})
export class StudentModule {}
  