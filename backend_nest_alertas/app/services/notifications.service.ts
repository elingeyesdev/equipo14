import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Report } from 'app/models/report.entity';
import { User } from 'app/models/user.entity';
import admin from 'config/firebase.config';

@Injectable()
export class NotificationsService {

    private readonly logger = new Logger(
        NotificationsService.name,
    );

    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async notifyNearbyUsers(report: Report): Promise<void> {
        try {
            const [longitude, latitude] =
                report.location.coordinates;
            const nearbyUsers = await this.usersRepository
                .createQueryBuilder('user')
                .where('user.fcm_token IS NOT NULL')
                .andWhere('user.last_location IS NOT NULL')
                .andWhere('user.id != :creatorId', {
                    creatorId: report.creator.id,
                })
                .andWhere(
                    `ST_DWithin(
                        user.last_location,
                        ST_SetSRID(
                            ST_MakePoint(:longitude, :latitude),
                            4326
                        )::geography,
                        100
                    )`,
                    {
                        longitude,
                        latitude,
                    }
                )
                .getMany();
            const tokens = nearbyUsers
                .map(user => user.fcm_token)
                .filter(Boolean);
            if (!tokens.length) {
                this.logger.log(
                    'No hay usuarios cercanos para notificar',
                );
                return;
            }
            await this.sendPushNotificationToMultipleTokens(
                tokens,
                `Nueva alerta: ${report.type.name}`,
                report.description ||
                    'Se ha reportado un incidente cerca de ti.',
                {
                    reportId: report.id.toString(),
                }
            );
        } catch (error) {
            this.logger.error(
                'Error notificando usuarios cercanos',
                error,
            );
        }
    }

    async sendPushNotificationToMultipleTokens(
        tokens: string[],
        title: string,
        body: string,
        data?: any,
    ): Promise<any> {
        if (!tokens?.length) {
            return;
        }
        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            tokens,
        };
        try {
            const response =
                await admin.messaging()
                    .sendEachForMulticast(message);
            this.logger.log(
                `Notificaciones enviadas. Exitos: ${response.successCount}, Fallos: ${response.failureCount}`
            );
            return response;
        } catch (error) {
            this.logger.error(
                'Error enviando notificaciones multicast:',
                error,
            );
            throw error;
        }
    }
}