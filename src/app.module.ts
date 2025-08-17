import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import envConfig from './utils/config/env.config';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SupervisorModule } from './modules/supervisor/supervisor.module';
import { StudentModule } from './modules/student/student.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: envConfig.dbType,
      host: envConfig.dbHost,
      port: Number(envConfig.dbPort),
      username: envConfig.dbUser,
      password: envConfig.dbPassword,
      database: envConfig.dbName,
      autoLoadEntities: true,
      synchronize: envConfig.nodeEnv !== 'production',
      extra: {
        connectionLimit: 10,
      },
    }),
    AuthModule,
    AdminModule,
    UserModule,
    SupervisorModule,
    StudentModule,
  ],
})
export class AppModule {}
