import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import type { IMailGateway } from './mail-gateway.interface';
import { ConsoleMailGateway } from './console-mail.gateway';
import { ResendMailGateway } from './resend-mail.gateway';

@Global()
@Module({
  providers: [
    {
      provide: 'MAIL_GATEWAY',
      inject: [ConfigService],
      useFactory: (config: ConfigService): IMailGateway => {
        const apiKey = config.get<string>('RESEND_API_KEY');
        if (apiKey && apiKey.length > 0) {
          return new ResendMailGateway(apiKey);
        }
        return new ConsoleMailGateway();
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
