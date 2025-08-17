import { Request } from 'express';
import { UserRole } from '../../entities/user.entity';

declare module 'express' {
  interface UserPayload {
    id: number;
    role: UserRole;
  }

  interface Request {
    user: UserPayload;
  }
}
