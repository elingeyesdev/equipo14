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

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class TrackingsGateway implements OnGatewayConnection, OnGatewayDisconnect {    
    @WebSocketServer()
    server: Server;

    private readonly socketUserMap = new Map<string, string>();

    constructor(private readonly trackingsService: TrackingsService) {}

    async handleConnection(client: Socket) {
        console.log(`Cliente conectado al canal de tracking: ${client.id}`);
        // enviar la lista de trackings activos iniciales al cliente recien conectado
        const trackings = await this.trackingsService.getAllTrackings();
        client.emit('trackings', trackings);
    }

    async handleDisconnect(client: Socket) {
        console.log(`Cliente desconectado del canal de tracking: ${client.id}`);
        const userId = this.socketUserMap.get(client.id);
        if (userId) {
            await this.trackingsService.deleteTracking(userId);
            this.socketUserMap.delete(client.id);
            // transmitir la lista de trackings actualizada
            const trackings = await this.trackingsService.getAllTrackings();
            this.server.emit('trackings', trackings);
            console.log(`Limpieza realizada para el tracking del usuario ${userId} al desconectarse`);
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
            console.warn(`Evento startTracking recibido con un payload no válido: ${JSON.stringify(payload)}`);
            return;
        }

        const { userId, ...rest } = payload;
        const trackingData = payload.data ? payload.data : rest;

        this.socketUserMap.set(client.id, userId);

        await this.trackingsService.saveTracking(userId, trackingData);

        const trackings = await this.trackingsService.getAllTrackings();
        this.server.emit('trackings', trackings);
    }

    @SubscribeMessage('stopTracking')
    async handleStopTracking(
        @MessageBody() payload: any,
        @ConnectedSocket() client: Socket,
    ) {
        if (!payload || !payload.userId) {
            console.warn(`Evento stopTracking recibido con un payload no válido: ${JSON.stringify(payload)}`);
            return;
        }

        const { userId } = payload;

        this.socketUserMap.delete(client.id);
        await this.trackingsService.deleteTracking(userId);

        const trackings = await this.trackingsService.getAllTrackings();
        this.server.emit('trackings', trackings);
    }
}
