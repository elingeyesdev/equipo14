import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispatch } from 'app/models/dispatch.entity';
import { StateType } from 'app/enums/state-type.enum';
import { Report } from 'app/models/report.entity';
import { EmergencyStation } from 'app/models/emergency-station.entity';
import { User } from 'app/models/user.entity';

@Injectable()
export class DispatchService {
    constructor(
        @InjectRepository(Dispatch)
        private readonly dispatchRepository: Repository<Dispatch>,
        @InjectRepository(Report)
        private readonly reportRepository: Repository<Report>,
        @InjectRepository(EmergencyStation)
        private readonly stationRepository: Repository<EmergencyStation>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(reportId: number, destinationId: number, userId: string): Promise<Dispatch> {
        const report = await this.reportRepository.findOne({ where: { id: reportId } });
        if (!report) {
            throw new NotFoundException(`Reporte con ID ${reportId} no encontrado`);
        }

        const destination = await this.stationRepository.findOne({ where: { id: destinationId } });
        if (!destination) {
            throw new NotFoundException(`Estación de emergencia con ID ${destinationId} no encontrada`);
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        const dispatch = new Dispatch();
        dispatch.response_report = report;
        dispatch.destination = destination;
        dispatch.attended_by = user;
        dispatch.state = StateType.EnCurso;

        return this.dispatchRepository.save(dispatch);
    }

    async updateState(id: number, state: StateType): Promise<Dispatch> {
        const dispatch = await this.dispatchRepository.findOne({ where: { id } });
        if (!dispatch) {
            throw new NotFoundException(`Despacho con ID ${id} no encontrado`);
        }
        dispatch.state = state;
        return this.dispatchRepository.save(dispatch);
    }
}
