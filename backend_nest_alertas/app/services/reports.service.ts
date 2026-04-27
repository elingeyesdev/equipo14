import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from '../models/report.entity';
import { Repository } from 'typeorm';
import { User } from 'app/models/user.entity';
import { CreateReportRequest, VerifyReportRequest } from '../http/requests/reports/request';
import { ImagesService } from './images.service';
import { ReportCoinicdenceResponse, ReportResponse } from 'app/http/requests/reports/response';
import { ReportType } from 'app/models/report-types.entity';

@Injectable()
export class ReportsService {

    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(ReportType)
        private reportTypeRepository: Repository<ReportType>,
        private imagesServices: ImagesService

    ){}
    //revisar esto manana
    //me gano el sueno, asi capaz este mal algo
    async create(createReportRequest: CreateReportRequest, file: Express.Multer.File){
        const user = await this.usersRepository.findOne({where: {id: createReportRequest.userId}})
        if(!user){
            throw new NotFoundException("Usuario no encontrado");
        }
        const type = await this.reportTypeRepository.findOne({where: {id: createReportRequest.type}})
        if(!type){
            throw new NotFoundException("Tipo no encontrado");
        }
        const now = new Date();
        const expires = new Date();
        expires.setHours(now.getHours() + 24); // expira en 24h (ejemplo)

        const createReport = createReportRequest.toReport();

        createReport.weight = 0
        createReport.created_at = now;
        createReport.expires_at = expires;
        createReport.user = user;
        createReport.type = type

        const newReport = this.reportsRepository.create(createReport);
        const savedReport = await this.reportsRepository.save(newReport);

        await this.imagesServices.createFromReport(savedReport, file)

        return ReportResponse.FromReportToResponse(savedReport);
    }

    async addImage(id: number, file: Express.Multer.File){
        const report = await this.reportsRepository.findOne({
            where: {id: Number(id)},
            relations: ['user','images', 'type']
        });
        if(!report){
            throw new NotFoundException("Reporte no encontrado")
        }

        const image = await this.imagesServices.createFromReport(report, file)

        if(!image){
            throw new BadRequestException("Error al subir la imagen")
        }

        report.weight =+ report.weight + 1

        const savedReport = await this.reportsRepository.save(report)

        return ReportResponse.FromReportToResponse(savedReport)
    }

    async findAll(){
        const reports = await this.reportsRepository.find({
            //aqui se cargan las relaciones
            relations: ['user', 'images', 'type'],
            order: {
                id: 'ASC'
            }
        });
        return ReportResponse.FromReportListToResponse(reports)
    }

    async findCoincidences(verifyReportRequest: VerifyReportRequest){
        const { latitude, longitude, type } = verifyReportRequest;

        const usersCoincidence =  await this.reportsRepository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.images', 'images')
            .leftJoinAndSelect('report.type', 'type')
            .where(
                `
                ST_DWithin(
                    report.location,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :radius
                )
                `,
                {
                    latitude,
                    longitude,
                    radius: 20, // metros
                }
            )
            .andWhere('type.id = :typeId', { typeId: type })
            .andWhere(
                `report.created_at >= NOW() - INTERVAL '200 minutes'`
            )
            .orderBy('report.created_at', 'DESC')
            .getMany();
        
        return ReportCoinicdenceResponse.FromReportListToResponse(usersCoincidence)
    }

    async findOne(id: string) {
        const report = await this.reportsRepository.findOne({
            where: {id: Number(id)},
            relations: ['user','images', 'type']
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
