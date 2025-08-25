import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Department } from 'src/entities/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Department])],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
