import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createResponse } from 'src/utils/global/create-response';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from 'src/entities/user.entity';
import { UserPayload } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { institutionId: dto.institutionId },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    await this.userRepository.save(user);

    return createResponse('Registration successful', { user });
  }

  async login(dto: LoginDto) {
    const { institutionId, password } = dto;

    const user = await this.userRepository
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
