import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) {}

    async sendUserCredentials(email: string, phone: string, passwordUnencrypted: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Credenciales de acceso',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #1a73e8; margin-top: 0;">Credenciales de tu Cuenta de Autoridad</h2>
                        <p>Hola,</p>
                        <p>Se ha creado una cuenta para ti en el sistema. A continuación se detallan tus credenciales de acceso:</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #1a73e8;">
                            <p style="margin: 5px 0;"><strong>Número de teléfono (Usuario):</strong> ${phone}</p>
                            <p style="margin: 5px 0;"><strong>Contraseña temporal:</strong> ${passwordUnencrypted}</p>
                        </div>
                        <p style="color: #e02424; font-size: 13px;"><strong>Importante:</strong> No compartas este correo electrónico con nadie y cambia tu contraseña al ingresar.</p>
                        <p style="margin-bottom: 0;">Saludos,<br>Chebi</p>
                    </div>
                `,
            });
            console.log(`Correo enviado correctamente a ${email}`);
        } catch (error) {
            console.log(`Error enviando correo a ${email}`, error);
        }
    }
}
