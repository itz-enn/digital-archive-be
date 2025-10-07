import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archive } from 'src/entities/archive.entity';
import { User } from 'src/entities/user.entity';
import { Assignment } from 'src/entities/assignment.entity';
import { Project } from 'src/entities/project.entity';
import { ProjectFile } from 'src/entities/project-file';
import { Notification } from 'src/entities/notification.entity';
import { CloudinaryProvider } from 'src/utils/provider/cloudinary.provider';
import { UserCron } from './user.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Archive,
      Assignment,
      Project,
      ProjectFile,
      Notification,
    ]),
  ],
  providers: [UserService, UserCron, CloudinaryProvider],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
