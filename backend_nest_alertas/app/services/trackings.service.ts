import { Injectable, Inject, Logger } from '@nestjs/common';

@Injectable()
export class TrackingsService {
    private readonly logger = new Logger(TrackingsService.name);
    private readonly redisKey = 'trackings';

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: any,
    ) {}

    async saveTracking(userId: string, data: any): Promise<void> {
        try {
            const trackingData = {
                ...data,
                timestamp: Date.now(),
            };
            await this.redisClient.hSet(this.redisKey, userId, JSON.stringify(trackingData));
            this.logger.log(`Tracking guardado para el usuario ${userId}`);
        } catch (error) {
            this.logger.error(`Error al guardar el tracking para el usuario ${userId}: ${error.message}`);
        }
    }

    async deleteTracking(userId: string): Promise<void> {
        try {
            await this.redisClient.hDel(this.redisKey, userId);
            this.logger.log(`Tracking eliminado para el usuario ${userId}`);
        } catch (error) {
            this.logger.error(`Error al eliminar el tracking para el usuario ${userId}: ${error.message}`);
        }
    }

    async getAllTrackings(): Promise<any[]> {
        try {
            const allTrackings = await this.redisClient.hGetAll(this.redisKey);
            const list: any[] = [];
            for (const [userId, valStr] of Object.entries(allTrackings)) {
                try {
                    const parsed = JSON.parse(valStr as string);
                    list.push({
                        id: userId,
                        ...parsed,
                    });
                } catch (e) {
                    this.logger.warn(`Fallo al analizar los datos de tracking para el usuario ${userId}`);
                }
            }
            return list;
        } catch (error) {
            this.logger.error(`Error al obtener todos los trackings: ${error.message}`);
            return [];
        }
    }
}
