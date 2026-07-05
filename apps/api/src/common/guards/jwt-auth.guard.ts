import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  status: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Token não fornecido');

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(request.user!.role)) {
        throw new UnauthorizedException('Acesso não autorizado para o seu perfil');
      }
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = (request.headers.authorization ?? '').split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
