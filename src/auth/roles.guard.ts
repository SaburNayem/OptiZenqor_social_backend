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
    const currentRole = this.normalizeRole(request.user?.role);
    const allowedRoles = requiredRoles.map((role) => this.normalizeRole(role));

    if (!currentRole || (currentRole !== 'superadmin' && !allowedRoles.includes(currentRole))) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return true;
  }

  private normalizeRole(role?: string) {
    const normalized = role?.trim().toLowerCase();
    if (!normalized) {
      return '';
    }
    if (normalized === 'superadmin' || normalized === 'super admin') {
      return 'superadmin';
    }
    if (
      normalized === 'admin' ||
      normalized === 'operations admin' ||
      normalized === 'content moderator' ||
      normalized === 'finance admin' ||
      normalized === 'support admin' ||
      normalized === 'analytics viewer'
    ) {
      return 'admin';
    }
    return normalized;
  }
}
