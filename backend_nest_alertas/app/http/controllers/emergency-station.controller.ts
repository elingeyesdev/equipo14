import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmergencyStationService } from 'app/services/emergency-station.service';

@ApiBearerAuth()
@ApiTags('emergency-stations')
@Controller('emergency-stations')
export class EmergencyStationController {
    constructor(private readonly emergencyStationService: EmergencyStationService) {}

    @Get()
    findAll() {
        return this.emergencyStationService.findAll();
    }
}
