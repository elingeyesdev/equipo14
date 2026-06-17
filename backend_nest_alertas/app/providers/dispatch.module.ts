import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { DispatchController } from 'app/http/controllers/dispatch.controller';
import { Dispatch } from 'app/models/dispatch.entity';
import { Report } from 'app/models/report.entity';
import { EmergencyStation } from 'app/models/emergency-station.entity';
import { User } from 'app/models/user.entity';
import { TrackingsService } from 'app/services/trackings.service';
import { DispatchService } from 'app/services/dispatch.service';
import { TrackingsGateway } from 'app/gateways/trackings.gateway';
import { createClient } from 'redis';

@Module({
    imports: [
        TypeOrmModule.forFeature([Dispatch, Report, EmergencyStation, User]),
        ConfigModule,
    ],
    controllers: [DispatchController],
    providers: [
        TrackingsService,
        DispatchService,
        TrackingsGateway,
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                const host = configService.get<string>('redis.host') || 'localhost';
                const port = configService.get<number>('redis.port') || 6379;
                const client = createClient({ url: `redis://${host}:${port}` });
                await client.connect();
                return client;
            },
            inject: [ConfigService],
        },
    ],
    exports: [TrackingsService, DispatchService, 'REDIS_CLIENT'],
})
export class DispatchModule {}
