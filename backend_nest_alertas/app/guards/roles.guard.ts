import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'app/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    const roleName = (user?.role?.name ?? '').toString().toLowerCase();

    if (!roleName) {
      throw new ForbiddenException('No tiene permisos para esta acción');
    }

    const allowed = required.some((r) => roleName === r.toLowerCase());
    if (!allowed) {
      throw new ForbiddenException('No tiene permisos para esta acción');
    }

    return true;
  }
}
