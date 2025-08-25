import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  mixin,
  Type,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../entities/user.entity';

export function RoleGuard(requiredRole: UserRole): Type<CanActivate> {
  @Injectable()
  class RoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request: Request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.role !== requiredRole) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      return true;
    }
  }
  return mixin(RoleGuardMixin);
}