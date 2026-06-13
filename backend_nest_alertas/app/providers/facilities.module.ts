import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyFacility } from 'app/models/emergency-facility.entity';
import { FacilitiesController } from 'app/http/controllers/facilities.controller';
import { FacilitiesService } from 'app/services/facilities.service';

@Module({
    imports: [TypeOrmModule.forFeature([EmergencyFacility])],
    providers: [FacilitiesService],
    controllers: [FacilitiesController],
    exports: [FacilitiesService],
})
export class FacilitiesModule {}
