import { Controller, Get, Query, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('archives')
  async getArchives(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('year') year?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.getArchives(search, category, year, page, limit);
  }

  @Get('archives/:id')
  async getArchiveById(@Param('id') id: string) {
    return this.userService.getArchiveById(Number(id));
  }
}
