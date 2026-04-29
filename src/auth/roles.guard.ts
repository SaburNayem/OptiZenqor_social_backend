import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const currentRole = request.user?.role?.trim().toLowerCase();
    const allowedRoles = requiredRoles.map((role) => role.trim().toLowerCase());

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return true;
  }
}
