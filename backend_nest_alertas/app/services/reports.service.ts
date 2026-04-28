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

        // Integración de Firebase: Enviar notificación a autoridades y usuarios cercanos (100 metros)
        try {
            const targetUsers = await this.usersRepository
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.role', 'role')
                .where('user.fcm_token IS NOT NULL')
                .andWhere(
                    `(role.id = 2 OR (role.id = 1 AND user.last_location IS NOT NULL AND ST_DWithin(
                        user.last_location,
                        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                        100
                    )))`,
                    {
                        longitude: createReportRequest.longitude,
                        latitude: createReportRequest.latitude,
                    }
                )
                .getMany();

            const tokens = targetUsers.map(u => u.fcm_token).filter(t => t);

            if (tokens.length > 0) {
                await this.notificationsService.sendPushNotificationToMultipleTokens(
                    tokens,
                    `Nueva Alerta: ${type.name}`,
                    createReport.description || 'Se ha reportado un nuevo incidente en tu zona.'
                );
            }
        } catch (error) {
            console.error('No se pudo enviar la notificación Push:', error);
            // No detenemos el flujo si la notificación falla
        }

        return ReportResponse.FromReportToResponse(savedReport);
    }

    // ### Mejorar el return de esta funcion ###
    async addImage(id: number, file: Express.Multer.File){
        const report = await this.reportsRepository.findOne({
            where: {id: Number(id)},
            //relations: ['user','images', 'type']
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

        return savedReport
    }

    async verifyReport(id: number, latitude: number, longitude: number, file: Express.Multer.File) {
        const report = await this.reportsRepository.findOne({
            where: { id: Number(id) },
            relations: ['user', 'images', 'type'],
        });
        if (!report) {
            throw new NotFoundException('Reporte no encontrado');
        }

        // Check distance: user must be within 50 meters of the report location
        const distance = await this.reportsRepository
            .createQueryBuilder('report')
            .select(`ST_Distance(
                ST_SetSRID(ST_MakePoint(:userLon, :userLat), 4326)::geography,
                report.location::geography
            )`, 'distance')
            .where('report.id = :reportId', { reportId: id })
            .setParameters({ userLat: latitude, userLon: longitude })
            .getRawOne();

        const distanceInMeters = parseFloat(distance?.distance ?? '99999');
        if (distanceInMeters > 50) {
            throw new BadRequestException(
                `Debes estar a menos de 50 metros del incidente para verificar. Distancia actual: ${Math.round(distanceInMeters)}m`
            );
        }

        // Attach the verification photo
        await this.imagesServices.createFromReport(report, file);

        // Mark as verified
        report.verified = true;
        report.weight = report.weight + 1;
        const saved = await this.reportsRepository.save(report);

        return ReportResponse.FromReportToResponse(saved);
    }

    async findNearby(latitude: number, longitude: number, radius: number) {
        const reports = await this.reportsRepository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.user', 'user')
            .leftJoinAndSelect('report.images', 'images')
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
