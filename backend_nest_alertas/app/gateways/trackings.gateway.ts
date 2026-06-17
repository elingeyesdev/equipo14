import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrackingsService } from 'app/services/trackings.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class TrackingsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(TrackingsGateway.name);
    
    @WebSocketServer()
    server: Server;

    // Mapea client.id -> userId para limpiar en desconexiones inesperadas
    private readonly socketUserMap = new Map<string, string>();

    constructor(private readonly trackingsService: TrackingsService) {}

    async handleConnection(client: Socket) {
        this.logger.log(`Cliente conectado: ${client.id}`);
        // Enviar la lista de trackings activos iniciales al cliente recién conectado
        const trackings = await this.trackingsService.getAllTrackings();
        client.emit('trackings', trackings);
    }

    async handleDisconnect(client: Socket) {
        this.logger.log(`Cliente desconectado: ${client.id}`);
        const userId = this.socketUserMap.get(client.id);
        if (userId) {
            await this.trackingsService.deleteTracking(userId);
            this.socketUserMap.delete(client.id);
            // Transmitir la lista de trackings actualizada
            const trackings = await this.trackingsService.getAllTrackings();
            this.server.emit('trackings', trackings);
            this.logger.log(`Limpieza realizada para el tracking del usuario ${userId} al desconectarse`);
        }
    }

    @SubscribeMessage('getTrackings')
    async handleGetTrackings(@ConnectedSocket() client: Socket) {
        const trackings = await this.trackingsService.getAllTrackings();
        client.emit('trackings', trackings);
    }

    @SubscribeMessage('startTracking')
    async handleStartTracking(
        @MessageBody() payload: any,
        @ConnectedSocket() client: Socket,
    ) {
        if (!payload || !payload.userId) {
            this.logger.warn(`Evento startTracking recibido con un payload no válido: ${JSON.stringify(payload)}`);
            return;
        }

        const { userId, ...rest } = payload;
        const trackingData = payload.data ? payload.data : rest;

        // Mapear client.id a userId
        this.socketUserMap.set(client.id, userId);

        await this.trackingsService.saveTracking(userId, trackingData);

        // Transmitir la lista actualizada a todos los clientes
        const trackings = await this.trackingsService.getAllTrackings();
        this.server.emit('trackings', trackings);
    }

    @SubscribeMessage('stopTracking')
    async handleStopTracking(
        @MessageBody() payload: any,
        @ConnectedSocket() client: Socket,
    ) {
        if (!payload || !payload.userId) {
            this.logger.warn(`Evento stopTracking recibido con un payload no válido: ${JSON.stringify(payload)}`);
            return;
        }

        const { userId } = payload;

        this.socketUserMap.delete(client.id);
        await this.trackingsService.deleteTracking(userId);

        // Transmitir la lista actualizada a todos los clientes
        const trackings = await this.trackingsService.getAllTrackings();
        this.server.emit('trackings', trackings);
    }
}
