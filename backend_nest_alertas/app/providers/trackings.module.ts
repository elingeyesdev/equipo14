import { Module } from '@nestjs/common';
import { TrackingsController } from 'app/http/controllers/trackings.controller';

@Module({
    controllers: [TrackingsController],
})
export class TrackingsModule {}
