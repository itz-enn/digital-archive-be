import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // TODO: register users, find out the fields to be used in the dto
  // Don't forget swagger implementation
  async register() {}

  @Post('login')
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 400, description: 'Invalid email or password.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
