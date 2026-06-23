import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmergencyStationService } from 'app/services/emergency-station.service';
import { CreateEmergencyStationRequest, UpdateEmergencyStationRequest } from 'app/http/requests/emergency-station/request';

@ApiBearerAuth()
@ApiTags('emergency-stations')
@Controller('emergency-stations')
export class EmergencyStationController {
    constructor(private readonly emergencyStationService: EmergencyStationService) {}

    @Get()
    findAll() {
        return this.emergencyStationService.findAll();
    }

    @Post()
    create(@Body() body: CreateEmergencyStationRequest) {
        return this.emergencyStationService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: UpdateEmergencyStationRequest) {
        return this.emergencyStationService.update(Number(id), body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.emergencyStationService.remove(Number(id));
    }
}
