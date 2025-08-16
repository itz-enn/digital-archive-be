import { Module } from '@nestjs/common';
import { SupervisorService } from './supervisor.service';
import { SupervisorController } from './supervisor.controller';

@Module({
  providers: [SupervisorService],
  controllers: [SupervisorController],
})
export class SupervisorModule {}
