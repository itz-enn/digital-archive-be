import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archive } from 'src/entities/archive.entity';
import { CoordinatorService } from './coordinator.service';
import { CoordinatorController } from './coordinator.controller';
import { User } from 'src/entities/user.entity';
import { Assignment } from 'src/entities/assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Archive, User, Assignment])],
  providers: [CoordinatorService],
  controllers: [CoordinatorController],
})
export class CoordinatorModule {}
