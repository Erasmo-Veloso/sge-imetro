import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  ConfirmPasswordResetDto,
  LoginDto,
  LogoutDto,
  RefreshDto,
  RequestPasswordResetDto,
} from './dto/auth.dto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: LogoutDto) {
    await this.auth.logout(dto.refreshToken);
  }

  @Post('password/reset/request')
  @HttpCode(204)
  async requestReset(@Body() dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!user) return; // do not leak existence

    const rawToken = await this.auth.requestPasswordReset(dto.email);
    if (!rawToken) return;

    const baseUrl = this.config.get<string>('WEB_URL') ?? 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;
    await this.mail.sendPasswordReset({ email: user.email }, user.name, resetUrl);
  }

  @Post('password/reset/confirm')
  @HttpCode(204)
  async confirmReset(@Body() dto: ConfirmPasswordResetDto & { token: string }) {
    await this.auth.confirmPasswordReset(dto.token, dto.newPassword);
  }
}
