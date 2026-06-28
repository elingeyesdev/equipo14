import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'app/models/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

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

    async sendMailToUser(id: string, subject: string, content: string): Promise<{ message: string }> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['authority_profile'],
        });

        if (!user) {
            throw new NotFoundException(`El user con ID ${id} no se encontro`);
        }

        if (!user.authority_profile || !user.authority_profile.gmail) {
            throw new BadRequestException('El usuario no tiene una dirección de correo configurada.');
        }

        const email = user.authority_profile.gmail;
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #1a73e8; margin-top: 0;">${subject}</h2>
                        <p>${content}</p>
                    </div>
                `,
            });
            console.log(`Correo enviado correctamente a ${email}`);
        } catch (error) {
            console.log(`Error enviando correo a ${email}`, error);
            throw error;
        }

        return { message: `Correo enviado exitosamente a ${email}` };
    }

    async resendCredentials(id: string): Promise<{ message: string }> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['authority_profile'],
        });

        if (!user) {
            throw new NotFoundException(`El usuario con ID ${id} no se encontró`);
        }

        if (!user.authority_profile || !user.authority_profile.gmail) {
            throw new BadRequestException('El usuario no tiene un perfil de autoridad o un correo electrónico configurado.');
        }

        const email = user.authority_profile.gmail;

        // Generar una contrasena temporal
        const tempPassword = Math.random().toString(36).substring(2, 10);
        const hashPassword = await bcrypt.hash(tempPassword, 12);

        user.password = hashPassword;
        await this.userRepository.save(user);

        await this.sendUserCredentials(
            email,
            user.phone,
            tempPassword,
        );

        return { message: `Credenciales reenviadas con éxito al correo ${email}` };
    }
}
