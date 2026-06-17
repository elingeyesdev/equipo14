import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingsController } from 'app/http/controllers/trackings.controller';
import { DispatchTracking } from 'app/models/dispatch-tracking.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DispatchTracking])],
    controllers: [TrackingsController],
})
export class TrackingsModule {}
