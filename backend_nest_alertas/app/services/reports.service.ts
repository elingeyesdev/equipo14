import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from '../models/report.entity';
import { Repository } from 'typeorm';
import { User } from 'app/models/user.entity';
import { CreateReportRequest } from '../http/requests/reports/request';
import { ImagesService } from './images.service';
import { ReportResponse } from 'app/http/requests/reports/response';

@Injectable()
export class ReportsService {

    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private imagesServices: ImagesService

    ){}
    //revisar esto manana
    //me gano el sueno, asi capaz este mal algo
    async create(createReportRequest: CreateReportRequest, file: Express.Multer.File){
        const user = await this.usersRepository.findOne({where: {id: createReportRequest.user}})
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

        await this.imagesServices.create(savedReport, file)

        return ReportResponse.FromReportToResponse(savedReport);
    }

    async findAll(){
        const reports = await this.reportsRepository.find({
            relations: ['user', 'images'],
            order: {
                id: 'ASC'
            }
        });
        return ReportResponse.FromReportListToResponse(reports)
    }

    async findOne(id: string) {
        const report = await this.reportsRepository.findOne({
            where: {id: Number(id)},
            relations: ['user','images']
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
