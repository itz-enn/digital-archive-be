import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createResponse } from 'src/utils/global/create-response';

@Injectable()
export class AdminService {
  constructor() {}

}
