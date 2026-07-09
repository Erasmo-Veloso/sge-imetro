import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import type { IMailGateway, MailMessage } from './mail-gateway.interface';

/**
 * Production mail gateway backed by Resend.
 */
export class ResendMailGateway implements IMailGateway {
  private readonly logger = new Logger('Mail(Resend)');
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: MailMessage): Promise<{ id?: string }> {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    const { data, error } = await this.client.emails.send({
      from: process.env.MAIL_FROM ?? 'no-reply@imetro.ao',
      to: recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      this.logger.error(`Resend error: ${error.name} — ${error.message}`);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    this.logger.debug(`sent id=${data?.id ?? 'n/a'} to=${recipients.length} recipient(s)`);
    return { id: data?.id };
  }
}
