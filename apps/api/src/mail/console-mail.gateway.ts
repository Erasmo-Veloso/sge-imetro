import { Logger } from '@nestjs/common';
import type { IMailGateway, MailMessage } from './mail-gateway.interface';
/**
 * Fallback mail gateway used in development when no RESEND_API_KEY is configured.
 * Logs the message to stdout instead of sending a real email.
 */
export class ConsoleMailGateway implements IMailGateway {
  private readonly logger = new Logger('Mail(Console)');

  async send(message: MailMessage): Promise<{ id?: string }> {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    this.logger.log(
      `→ to=${recipients.map((r: { email: string }) => r.email).join(',')} subject="${message.subject}"`,
    );
    if (message.text) this.logger.debug(message.text);
    return { id: undefined };
  }
}
