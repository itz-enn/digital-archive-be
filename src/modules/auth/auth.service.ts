import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createResponse } from 'src/utils/global/create-response';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entities/user.entity';
import { UserPayload } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Department } from 'src/entities/department.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,

    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const { institutionId, password } = dto;
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .where('user.institutionId = :institutionId', { institutionId })
      .addSelect('user.password')
      .getOne();
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException('Invalid ID or password');

    const payload: UserPayload = {
      id: user.id,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    delete user.password;

    return createResponse('Login successful', {
      access_token: token,
      user: { ...user, department: user.department?.name ?? null },
    });
  }

  //TODO: complete
  // async forgottenPassword() {}
}
