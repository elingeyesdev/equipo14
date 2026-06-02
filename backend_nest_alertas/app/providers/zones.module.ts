import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from 'app/models/zone.entity';
import { ZonesController } from 'app/http/controllers/zones.controller';
import { ZonesService } from 'app/services/zones.service';

@Module({
    imports: [TypeOrmModule.forFeature([Zone])],
    providers: [ZonesService],
    controllers: [ZonesController],
    exports: [ZonesService],
})
export class ZonesModule {}
