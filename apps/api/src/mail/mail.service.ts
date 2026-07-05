import { Inject, Injectable } from '@nestjs/common';
import type { IMailGateway, MailAddress, MailMessage } from './mail-gateway.interface';

@Injectable()
export class MailService {
  constructor(@Inject('MAIL_GATEWAY') private readonly gateway: IMailGateway) {}

  async send(message: MailMessage): Promise<void> {
    await this.gateway.send(message);
  }

  async sendWelcome(to: MailAddress, name: string): Promise<void> {
    const { welcomeEmail } = await import('./templates');
    await this.gateway.send({ to, ...welcomeEmail(name) });
  }

  async sendPasswordReset(to: MailAddress, name: string, resetUrl: string): Promise<void> {
    const { passwordResetEmail } = await import('./templates');
    await this.gateway.send({ to, ...passwordResetEmail(name, resetUrl) });
  }

  async sendEnrollmentStatus(to: MailAddress, name: string, status: string): Promise<void> {
    const { enrollmentStatusEmail } = await import('./templates');
    await this.gateway.send({ to, ...enrollmentStatusEmail(name, status) });
  }
}
