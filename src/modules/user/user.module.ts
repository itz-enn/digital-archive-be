import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archive } from 'src/entities/archive.entity';

@Module({
   imports: [TypeOrmModule.forFeature([Archive])],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
