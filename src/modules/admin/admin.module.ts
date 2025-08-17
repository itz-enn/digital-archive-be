import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archive } from 'src/entities/archive.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Archive])],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
