import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor() {
        // Inicializar Firebase Admin SDK si no está inicializado
        if (!admin.apps.length) {
            try {
                admin.initializeApp({
                    // Para producción, se recomienda usar una variable de entorno con la ruta al serviceAccountKey.json
                    // credential: admin.credential.cert(require('../../firebase-service-account.json')),
                    // Si estás en GCP/Firebase Cloud Functions, se puede auto-descubrir.
                    // credential: admin.credential.applicationDefault()
                });
                this.logger.log('Firebase Admin inicializado correctamente');
            } catch (error) {
                this.logger.error('Error al inicializar Firebase Admin', error);
            }
        }
    }

    /**
     * Enviar notificación push a un token específico (dispositivo)
     */
    async sendPushNotificationToToken(token: string, title: string, body: string, data?: any) {
        if (!token) return;
        
        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            token: token,
        };

        try {
            const response = await admin.messaging().send(message);
            this.logger.log(`Notificación enviada con éxito: ${response}`);
            return response;
        } catch (error) {
            this.logger.error('Error enviando notificación push:', error);
            throw error;
        }
    }

    /**
     * Enviar notificación push a un grupo de dispositivos (por tema/topic)
     */
    async sendPushNotificationToTopic(topic: string, title: string, body: string, data?: any) {
        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            topic: topic,
        };

        try {
            const response = await admin.messaging().send(message);
            this.logger.log(`Notificación enviada al tema ${topic}: ${response}`);
            return response;
        } catch (error) {
            this.logger.error(`Error enviando notificación al tema ${topic}:`, error);
            throw error;
        }
    }
}
