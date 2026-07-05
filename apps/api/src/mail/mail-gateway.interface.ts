export interface MailAddress {
  email: string;
  name?: string;
}

export interface MailContent {
  subject: string;
  html: string;
  text?: string;
}

export interface MailMessage extends MailContent {
  to: MailAddress | MailAddress[];
}

export interface IMailGateway {
  send(message: MailMessage): Promise<{ id?: string }>;
}
