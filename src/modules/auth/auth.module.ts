import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import envConfig from 'src/utils/config/env.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { JwtStrategy } from 'src/utils/strategies/jwt.strategy';
import { Department } from 'src/entities/department.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: envConfig.jwtSecret,
      signOptions: { expiresIn: '3d' },
    }),
    TypeOrmModule.forFeature([User, Department]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
