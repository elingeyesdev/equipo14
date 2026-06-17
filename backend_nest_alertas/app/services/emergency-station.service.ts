import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyStation } from 'app/models/emergency-station.entity';
import { EmergencyStationResponse } from 'app/http/requests/emergency-station/response';

@Injectable()
export class EmergencyStationService {
    constructor(
        @InjectRepository(EmergencyStation)
        private readonly emergencyStationRepository: Repository<EmergencyStation>,
    ) {}

    async findAll() {
        const stations = await this.emergencyStationRepository.find();
        return EmergencyStationResponse.FromEmergencyStationListToResponse(stations);
    }
}
