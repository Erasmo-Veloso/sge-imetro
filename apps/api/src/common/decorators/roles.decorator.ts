import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to one or more roles. Used together with MetadataRolesGuard.
 * @example
 * @Roles('ADMIN')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
