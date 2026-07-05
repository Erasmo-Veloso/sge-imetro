import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import type { AuthUser } from '../current-user.decorator';

/**
 * Guard that restricts access to the given roles. Must be used after JwtAuthGuard
 * (or any guard that populates `request.user`).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  static for(...roles: AuthUser['role'][]) {
    return new RolesGuard(roles);
  }

  constructor(private readonly allowed: AuthUser['role'][]) {}

  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    if (!user) throw new ForbiddenException('Utilizador não autenticado');
    if (!this.allowed.includes(user.role)) {
      throw new ForbiddenException('Acesso não autorizado para o seu perfil');
    }
    return true;
  }
}
