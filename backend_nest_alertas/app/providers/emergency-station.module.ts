import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyStation } from 'app/models/emergency-station.entity';
import { EmergencyStationController } from 'app/http/controllers/emergency-station.controller';
import { EmergencyStationService } from 'app/services/emergency-station.service';

@Module({
    imports: [TypeOrmModule.forFeature([EmergencyStation])],
    providers: [EmergencyStationService],
    controllers: [EmergencyStationController],
    exports: [EmergencyStationService],
})
export class EmergencyStationModule {}
