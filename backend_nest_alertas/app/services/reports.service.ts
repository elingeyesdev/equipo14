import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from '../models/report.entity';
import { Repository } from 'typeorm';
import { User } from 'app/models/user.entity';
import { CreateReportRequest, VerifyReportRequest } from '../http/requests/reports/request';
import { ImagesService } from './images.service';
import { ReportCoinicdenceResponse, ReportResponse } from 'app/http/requests/reports/response';
import { ReportType } from 'app/models/report-types.entity';

import { NotificationsService } from './notifications.service';

@Injectable()
export class ReportsService {

    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(ReportType)
        private reportTypeRepository: Repository<ReportType>,

        private imagesServices: ImagesService,
        private notificationsService: NotificationsService

    ){}
    // revisar esto manana
    // me gano el sueno, asi capaz este mal algo
    // Ahora q ya fue revisado parece q esta bien en general
    async create(createReportRequest: CreateReportRequest, file: Express.Multer.File){
        console.time('upload');
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

        // Prioridad inicial: base_weight + bonus por descripción larga
        let initialWeight = type.base_weight || 1;
        if (createReportRequest.description.length > 100) initialWeight += 2;
        
        // La verificacion es por default false por eso ya no se setea aqui
        createReport.weight = initialWeight;
        createReport.created_at = now;
        createReport.expires_at = expires;
        createReport.creator = user;
        createReport.type = type
        createReport.zone = createReportRequest.zone || 'Zona desconocida';

        const newReport = this.reportsRepository.create(createReport);
        const savedReport = await this.reportsRepository.save(newReport);


        const image = await this.imagesServices.createFromReport(savedReport, user, file)
        

        if(!image){
            throw new BadRequestException("Error al subir la imagen")
        }
        savedReport.images = [image];

        await this.notificationsService.notifyNearbyUsers(savedReport);
        console.timeEnd('upload');

        return ReportResponse.FromReportToResponse(savedReport);
    }

    // La funcion retorna lo justo y necesario
    // Se planteara el uso de un respone si es necesario, pero de momento no
    async addImage(reportId: number, userId: string, file: Express.Multer.File){
        const report = await this.reportsRepository.findOne({
            where: {id: Number(reportId)},
            relations: ['creator', 'type', 'images', 'images.uploadedBy']
        });
        if(!report){
            throw new NotFoundException("Reporte no encontrado")
        }

        const user = await this.usersRepository.findOne({
            where: { id: userId }
        });
        if(!user){
            throw new NotFoundException("Usuario no encontrado")
        }

        const image = await this.imagesServices.createFromReport(report, user, file)

        if(!image){
            throw new BadRequestException("Error al subir la imagen")
        }

        report.images.push(image);
        report.weight += 1

        const savedReport = await this.reportsRepository.save(report)

        return ReportResponse.FromReportToResponse(savedReport)
    }

    // Marcar verificado, opcion reservada solo para el panel administrativo, solo para autoridades
    // Permitiendo q los pesos para este reporte sean irrelevantes
    // Y pasando a maxima prioridad
    async verifyReport(id: number) {
        const report = await this.reportsRepository.findOne({
            where: { id: Number(id) },
        });
        if (!report) {
            throw new NotFoundException('Reporte no encontrado');
        }
        report.verified = true
        const savedReport = await this.reportsRepository.save(report);

        return savedReport;
    }

    async findOne(id: string) {
        const report = await this.reportsRepository.findOne({
            where: {id: Number(id)},
            relations: ['creator','images','images.uploadedBy', 'type']
        });
        if(!report){
            throw new NotFoundException("Reporte no encontrado")
        }
        return ReportResponse.FromReportToResponse(report)
    }
    async findByUserId(userId: string) {
        const reports = await this.reportsRepository.find({
            where: {
                creator: {
                    id: userId,
                },
            },
            relations: ['creator', 'images', 'images.uploadedBy', 'type'],
            order: {
                id: 'DESC',
            },
        });
        return ReportResponse.FromReportListToResponse(reports)
    }

    async findAll(){
        const reports = await this.reportsRepository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.creator', 'creator')
            .leftJoinAndSelect('report.type', 'type')
            .leftJoinAndSelect('report.images', 'images')
            .leftJoinAndSelect('images.uploadedBy', 'uploadedBy')
            .orderBy('report.id', 'ASC')
            .getMany();

        return ReportResponse.FromReportListToResponse(reports)
    }

    async findNearby(latitude: number, longitude: number, radius: number) {
        const reports = await this.reportsRepository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.creator', 'creator')
            .leftJoinAndSelect('report.images', 'images')
            .leftJoinAndSelect('images.uploadedBy', 'uploadedBy')
            .leftJoinAndSelect('report.type', 'type')
            .where(
                `ST_DWithin(
                    report.location,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :radius
                )`,
                { latitude, longitude, radius }
            )
            .orderBy('report.created_at', 'DESC')
            .getMany();

        return ReportResponse.FromReportListToResponse(reports);
    }

    async findCoincidences(verifyReportRequest: VerifyReportRequest){
        const { latitude, longitude, type } = verifyReportRequest;

        const usersCoincidence =  await this.reportsRepository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.images', 'images')
            .leftJoinAndSelect('images.uploadedBy', 'uploadedBy')
            .leftJoinAndSelect('report.type', 'type')
            .leftJoinAndSelect('report.creator', 'creator')
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
                    radius: 100, // metros (aumentado para mejor UX)
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
    
    async remove(id: string){
        const result = await this.reportsRepository.delete(id);

        if(result.affected === 0){
            throw new NotFoundException(`El reporte con ID ${id} no se encontro`)
        }
        return { message: "Reporte eliminado correctamente" };
    }
}
