import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from '../services/mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mailConfig = configService.get('mail');
        return {
          transport: {
            host: mailConfig.host,
            port: mailConfig.port,
            secure: mailConfig.secure,
            auth: {
              user: mailConfig.user,
              pass: mailConfig.pass,
            },
          },
          defaults: {
            from: `"Sistema de Alertas" <${mailConfig.user}>`,
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
