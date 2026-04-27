import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor() {
        // Inicializar Firebase Admin SDK si no está inicializado
        if (!admin.apps.length) {
            try {
                const fs = require('fs');
                const path = require('path');
                const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
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

    /**
     * Enviar notificación push a multiples dispositivos (Multicast)
     */
    async sendPushNotificationToMultipleTokens(tokens: string[], title: string, body: string, data?: any) {
        if (!tokens || tokens.length === 0) return;

        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            tokens: tokens,
        };

        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            this.logger.log(`Notificaciones enviadas. Exitos: ${response.successCount}, Fallos: ${response.failureCount}`);
            return response;
        } catch (error) {
            this.logger.error('Error enviando notificaciones multicast:', error);
            throw error;
        }
    }
}
