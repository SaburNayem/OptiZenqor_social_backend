import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminDatabaseService } from '../services/admin-database.service';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly adminDatabase: AdminDatabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
      admin?: unknown;
      user?: unknown;
    }>();
    const authorization = request.headers?.authorization;
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    if (!admin) {
      throw new UnauthorizedException('Admin authentication required.');
    }

    request.admin = admin;
    request.user = {
      id: admin.adminId,
      role: admin.role,
      email: admin.email,
      name: admin.name,
    };
    return true;
  }
}
