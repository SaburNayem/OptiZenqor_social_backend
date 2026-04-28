import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CoreDatabaseService } from '../services/core-database.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
      user?: unknown;
    }>();
    const authorization = request.headers?.authorization;
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }
    request.user = user;
    return true;
  }
}
