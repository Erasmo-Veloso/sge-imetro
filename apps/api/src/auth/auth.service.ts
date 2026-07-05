import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/guards/jwt-auth.guard';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Login ──────────────────────────────────────────────
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Conta não ativa (estado: ${user.status})`);
    }

    const { accessToken, refreshToken } = await this.issueTokens(this.toPayload(user));
    await this.storeRefreshToken(user.id, refreshToken);
    this.logger.log(`login user=${user.email} role=${user.role}`);
    return {
      accessToken,
      refreshToken,
      user: this.publicUser(user),
    };
  }

  // ── Refresh ───────────────────────────────────────────
  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored) throw new UnauthorizedException('Refresh token inválido');
    if (stored.revokedAt) throw new UnauthorizedException('Refresh token revogado');
    if (stored.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expirado');

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const { accessToken, refreshToken: newRefresh } = await this.issueTokens(
      this.toPayload(stored.user),
    );
    await this.storeRefreshToken(stored.user.id, newRefresh);
    return { accessToken, refreshToken: newRefresh };
  }

  // ── Logout ────────────────────────────────────────────
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Logout all sessions for a user ────────────────────
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Password reset: request ───────────────────────────
  async requestPasswordReset(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) return null; // do not leak existence

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    return rawToken;
  }

  // ── Password reset: confirm ───────────────────────────
  async confirmPasswordReset(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    const entry = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!entry) throw new UnauthorizedException('Token inválido');
    if (entry.usedAt) throw new UnauthorizedException('Token já utilizado');
    if (entry.expiresAt < new Date()) throw new UnauthorizedException('Token expirado');

    const rounds = this.config.get<number>('BCRYPT_ROUNDS') ?? 12;
    const passwordHash = await bcrypt.hash(newPassword, rounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: entry.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: entry.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: entry.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  // ── Helpers ───────────────────────────────────────────
  private async issueTokens(payload: JwtPayload) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
    });
    const refreshToken = randomBytes(48).toString('base64url');
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const ttl = this.parseTtlSeconds(this.config.get<string>('JWT_REFRESH_TTL') ?? '7d');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private parseTtlSeconds(ttl: string): number {
    const match = ttl.match(/^(\d+)\s*([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 86400);
  }

  private toPayload(user: {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    status: string;
  }): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  }

  private publicUser(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    phone: string | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }
}
