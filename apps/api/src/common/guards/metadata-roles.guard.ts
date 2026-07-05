import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * RolesGuard that reads allowed roles from the @Roles() metadata decorator.
 */
@Injectable()
export class MetadataRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;
    return required.includes(user.role);
  }
}
