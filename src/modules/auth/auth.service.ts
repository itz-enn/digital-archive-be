import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createResponse } from 'src/utils/global/create-response';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entities/user.entity';
import { UserPayload } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Department } from 'src/entities/department.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,

    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepo.findOne({
      where: { institutionId: dto.institutionId },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const department = await this.deptRepo.findOneBy({ id: dto.departmentId });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      department,
    });
    await this.userRepo.save(user);

    return createResponse('Registration successful', { user });
  }

  async login(dto: LoginDto) {
    const { institutionId, password } = dto;

    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('user.institutionId = :institutionId', { institutionId })
      .addSelect('user.password')
      .getOne();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid ID or password');
    }

    const payload: UserPayload = {
      id: user.id,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    delete user.password;

    return createResponse('Login successful', {
      access_token: token,
      user,
    });
  }

  //TODO: complete
  // async forgottenPassword() {}
}
