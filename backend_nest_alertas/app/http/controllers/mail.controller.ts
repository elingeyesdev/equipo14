import { Controller, Post, Param, Body } from '@nestjs/common';
import { MailService } from '../../services/mail.service';
import { SendMailRequest } from '../requests/mail/send-mail.request';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('mail')
export class MailController {
    constructor(
        private readonly mailService: MailService,
    ) {}

    @Post(':id')
    async sendMail(
        @Param('id') id: string,
        @Body() body: SendMailRequest,
    ) {
        return this.mailService.sendMailToUser(id, body.subject, body.content);
    }

    @Post(':id/resend-credentials')
    async resendCredentials(
        @Param('id') id: string,
    ) {
        return this.mailService.resendCredentials(id);
    }
}
