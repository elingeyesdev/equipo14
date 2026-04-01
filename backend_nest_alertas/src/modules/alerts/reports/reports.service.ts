import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateReportRequest } from './dto/request';
import { ReportResponse } from './dto/response';

@Injectable()
export class ReportsService {

    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
        @InjectRepository(User)
        private userRepository: Repository<User>
    ){}
    //revisar esto manana
    //me gano el sueno, asi capaz este mal algo
    async create(createReportRequest: CreateReportRequest){  
        const user = await this.userRepository.findOne({where: {id: createReportRequest.user}})
        if(!user){
            throw new NotFoundException("Usuario no encontrado");
        }
        const now = new Date();
        const expires = new Date();
        expires.setHours(now.getHours() + 24); // expira en 24h (ejemplo)

        const createReport = createReportRequest.toReport();

        createReport.weight = 0
        createReport.created_at = now;
        createReport.expires_at = expires;
        createReport.user = user;

        const newReport = this.reportsRepository.create(createReport);
        const savedReport = await this.reportsRepository.save(newReport);
        
        return ReportResponse.FromReportToResponse(savedReport);
    }

    async findAll(){
        const reports = await this.reportsRepository.find({
            relations: ['user']
        });
        return ReportResponse.FromReportListToResponse(reports)
    }

    async findOne(id: string) {
        const report = await this.reportsRepository.findOne({
            where: {id: Number(id)},
            relations: ['user']
        });
        if(!report){
            throw new NotFoundException("Reporte no encontrado")
        }
        return ReportResponse.FromReportToResponse(report)
    }

    async remove(id: string){
        const result = await this.reportsRepository.delete(id);

        if(result.affected === 0){
            throw new NotFoundException(`El reporte con ID ${id} no se encontro`)
        }
        return { message: "Reporte eliminado correctamente" };
    }
}
