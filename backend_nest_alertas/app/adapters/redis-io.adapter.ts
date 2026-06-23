import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;

    constructor(private app: INestApplicationContext) {
        super(app);
    }

    async connectToRedis(): Promise<void> {
        try {
            const configService = this.app.get(ConfigService);
            const host = configService.get<string>('redis.host') || 'localhost';
            const port = configService.get<number>('redis.port') || 6379;
            const redisUrl = `redis://${host}:${port}`;

            const pubClient = createClient({ url: redisUrl });
            pubClient.on('error', (err) => {
                console.error('Error en el cliente Pub de Redis para IoAdapter:', err);
            });

            const subClient = pubClient.duplicate();
            subClient.on('error', (err) => {
                console.error('Error en el cliente Sub de Redis para IoAdapter:', err);
            });

            await Promise.all([pubClient.connect(), subClient.connect()]);

            this.adapterConstructor = createAdapter(pubClient, subClient);
            console.log('Conexión exitosa a Redis para IoAdapter.');
        } catch (error) {
            console.error('Fallo al conectar a Redis para IoAdapter, usando adaptador en memoria por defecto:', error);
        }
    }

    override createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        if (this.adapterConstructor) {
            server.adapter(this.adapterConstructor);
        } else {
            console.warn('Socket.IO está usando el adaptador en memoria por defecto (Redis está offline).');
        }
        return server;
    }
}
