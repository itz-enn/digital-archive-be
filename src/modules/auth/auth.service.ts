import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createResponse } from 'src/utils/global/create-response';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entities/user.entity';
import { UserPayload } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  //TODO: complete function
  async register(dto: RegisterDto) {}

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // TODO: Check if the user is verified
    // if (!user.email_verified) {
    //   throw new BadRequestException('User account is not verified');
    // }

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
  async forgottenPassword() {}

}
