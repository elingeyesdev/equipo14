import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Report } from 'app/models/report.entity';
import { User } from 'app/models/user.entity';
import admin from 'config/firebase.config';

const ROUTE_CORRIDOR_RADIUS_METERS = 250;
const ROUTE_NOTIFY_COOLDOWN_MS = 10 * 60 * 1000;

@Injectable()
export class NotificationsService {

    private readonly logger = new Logger(
        NotificationsService.name,
    );

    /** Evita spam: clave authorityId-userId → timestamp último envío */
    private readonly routeNotifyCooldown = new Map<string, number>();

    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    private buildLineStringWkt(route: { lat: number; lng: number }[]): string {
        const coords = route
            .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
            .map((p) => `${p.lng} ${p.lat}`);
        if (coords.length < 2) {
            throw new BadRequestException('Se requieren al menos 2 puntos de ruta');
        }
        return `LINESTRING(${coords.join(',')})`;
    }

    private shouldNotifyRoute(authorityId: string, userId: string): boolean {
        const key = `${authorityId}:${userId}`;
        const now = Date.now();
        const last = this.routeNotifyCooldown.get(key);
        if (last != null && now - last < ROUTE_NOTIFY_COOLDOWN_MS) {
            return false;
        }
        this.routeNotifyCooldown.set(key, now);
        return true;
    }

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

    async notifyUsersAlongRoute(params: {
        route: { lat: number; lng: number }[];
        excludeUserId: string;
        incidentType?: string;
        description?: string;
        reportId?: number;
    }): Promise<{ notified: number; skippedCooldown: number }> {
        try {
            const lineWkt = this.buildLineStringWkt(params.route);
            const nearbyUsers = await this.usersRepository
                .createQueryBuilder('user')
                .where('user.fcm_token IS NOT NULL')
                .andWhere('user.last_location IS NOT NULL')
                .andWhere('user.id != :excludeUserId', {
                    excludeUserId: params.excludeUserId,
                })
                .andWhere(
                    `ST_DWithin(
                        user.last_location,
                        ST_Buffer(
                            ST_GeogFromText(:lineWkt),
                            :radius
                        ),
                        0
                    )`,
                    {
                        lineWkt,
                        radius: ROUTE_CORRIDOR_RADIUS_METERS,
                    },
                )
                .getMany();

            const tokens: string[] = [];
            let skippedCooldown = 0;

            for (const user of nearbyUsers) {
                if (!this.shouldNotifyRoute(params.excludeUserId, user.id)) {
                    skippedCooldown += 1;
                    continue;
                }
                if (user.fcm_token) {
                    tokens.push(user.fcm_token);
                }
            }

            if (!tokens.length) {
                this.logger.log(
                    `Sin usuarios en corrido de ruta (omitidos por cooldown: ${skippedCooldown})`,
                );
                return { notified: 0, skippedCooldown };
            }

            const typeLabel = params.incidentType?.trim() || 'Emergencia';
            await this.sendPushNotificationToMultipleTokens(
                tokens,
                'Unidad de emergencia en camino',
                `Hay una unidad respondiendo a «${typeLabel}» cerca de tu ubicación. Mantente atento.`,
                {
                    type: 'route_corridor',
                    incidentType: typeLabel,
                    reportId: params.reportId?.toString() ?? '',
                },
            );

            this.logger.log(
                `Notificados ${tokens.length} usuarios en corrido de ruta (cooldown omitidos: ${skippedCooldown})`,
            );
            return { notified: tokens.length, skippedCooldown };
        } catch (error) {
            this.logger.error('Error notificando usuarios en corrido de ruta', error);
            throw error;
        }
    }

    async notifyReportVerified(report: Report): Promise<void> {
        try {
            const creator = report.creator;
            if (!creator?.fcm_token) {
                this.logger.log('Creador sin token FCM — omitiendo notificación de verificación');
                return;
            }
            await this.sendPushNotificationToMultipleTokens(
                [creator.fcm_token],
                'Reporte verificado',
                `Tu reporte #${report.id} fue confirmado por una autoridad.`,
                {
                    reportId: report.id.toString(),
                    type: 'report_verified',
                },
            );
        } catch (error) {
            this.logger.error('Error notificando verificación de reporte', error);
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