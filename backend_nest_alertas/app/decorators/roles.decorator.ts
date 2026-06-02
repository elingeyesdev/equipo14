import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Nombres de rol en minúsculas: usuario | autoridad | admin */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
