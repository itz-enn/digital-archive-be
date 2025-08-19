import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archive } from 'src/entities/archive.entity';
import { CoordinatorService } from './coordinator.service';
import { CoordinatorController } from './coordinator.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Archive])],
  providers: [CoordinatorService],
  controllers: [CoordinatorController],
})
export class CoordinatorModule {}
