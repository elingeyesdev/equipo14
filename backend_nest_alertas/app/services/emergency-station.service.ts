import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyStation } from 'app/models/emergency-station.entity';
import { EmergencyStationResponse } from 'app/http/requests/emergency-station/response';
import { CreateEmergencyStationRequest, UpdateEmergencyStationRequest } from 'app/http/requests/emergency-station/request';

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

    async create(request: CreateEmergencyStationRequest) {
        const newStation = this.emergencyStationRepository.create(request.toEmergencyStation());
        const savedStation = await this.emergencyStationRepository.save(newStation);
        return EmergencyStationResponse.FromEmergencyStationToResponse(savedStation);
    }

    async update(id: number, request: UpdateEmergencyStationRequest) {
        const station = await this.emergencyStationRepository.findOne({ where: { id } });
        if (!station) {
            throw new NotFoundException(`La estación de emergencia con ID ${id} no se encontró.`);
        }
        station.name = request.name;
        const savedStation = await this.emergencyStationRepository.save(station);
        return EmergencyStationResponse.FromEmergencyStationToResponse(savedStation);
    }

    async remove(id: number) {
        const station = await this.emergencyStationRepository.findOne({ where: { id } });
        if (!station) {
            throw new NotFoundException(`La estación de emergencia con ID ${id} no se encontró.`);
        }
        await this.emergencyStationRepository.softDelete(id);
        return { message: "Estación de emergencia eliminada correctamente." };
    }
}
