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
import { ReportsGateway } from 'app/gateways/reports.gateway';
import { StateReport } from 'app/enums/state-report.enum';

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
        private notificationsService: NotificationsService,
        private readonly reportsGateway: ReportsGateway,
    ){}

    async create(createReportRequest: CreateReportRequest, file: Express.Multer.File){
        console.time('total');
        console.time('upload');
        const user = await this.usersRepository.findOne({where: {id: createReportRequest.userId}})
        if(!user){
            throw new NotFoundException("Usuario no encontrado");
        }
        const type = await this.reportTypeRepository.findOne({where: {id: createReportRequest.type}})
        if(!type){
            throw new NotFoundException("Tipo no encontrado");
        }

        const expires = new Date();
        expires.setHours(expires.getHours() + 2);

        const createReport = createReportRequest.toReport();

        let initialWeight = type.base_weight || 1;
        if (createReportRequest.description.length > 100) initialWeight += 2;

        createReport.weight = initialWeight;
        createReport.expires_at = expires;
        createReport.creator = user;
        createReport.type = type;
        createReport.zone = createReportRequest.zone || 'Zona desconocida';
        createReport.status = StateReport.Activo;

        const newReport = this.reportsRepository.create(createReport);
        const savedReport = await this.reportsRepository.save(newReport);

        const image = await this.imagesServices.createFromReport(savedReport, user, file)

        if(!image){
            throw new BadRequestException("Error al subir la imagen")
        }
        savedReport.images = [image];

        console.time('notifications');
        await this.notificationsService.notifyNearbyUsers(savedReport);
        console.timeEnd('notifications');
        
        console.timeEnd('upload');

        console.timeEnd('total');
        const reportResponse = ReportResponse.FromReportToResponse(savedReport);

        this.reportsGateway.sendNewReportNotification(reportResponse);

        return reportResponse;
    }

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

    async verifyReport(id: number) {
        const report = await this.reportsRepository.findOne({
            where: { id: Number(id) },
            relations: ['creator'],
        });
        if (!report) {
            throw new NotFoundException('Reporte no encontrado');
        }
        report.verified = true
        const savedReport = await this.reportsRepository.save(report);

        savedReport.creator = report.creator;
        await this.notificationsService.notifyReportVerified(savedReport);

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

    async findAll() {
        const reports = await this.reportsRepository.find({
            relations: ['creator', 'images', 'images.uploadedBy', 'type'],
            order: {
                created_at: 'DESC'
            }
        })
        return ReportResponse.FromReportListToResponse(reports);
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
            .andWhere(`COALESCE(report.updated_at, report.created_at) >= NOW() - INTERVAL '2 hours'`)
            .orderBy('report.created_at', 'DESC')
            .getMany();

        return ReportResponse.FromReportListToResponse(reports);
    }

    async findCoincidences(verifyReportRequest: VerifyReportRequest){
        const { latitude, longitude, type, userId } = verifyReportRequest;

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
                    radius: 100,
                }
            )
            .andWhere('type.id = :typeId', { typeId: type })
            .andWhere(
                `report.created_at >= NOW() - INTERVAL '200 minutes'`
            )
            .andWhere(
                `
                NOT EXISTS (
                    SELECT 1
                    FROM image img
                    WHERE img."reportId" = report.id
                    AND img."uploadedById" = :userId
                )
                `,
                {
                    userId,
                }
            )
            .orderBy('report.created_at', 'DESC')
            .getMany();

        console.log(usersCoincidence)
        console.log(latitude, longitude)
        return ReportCoinicdenceResponse.FromReportListToResponse(usersCoincidence)
    }

    async remove(id: string){
        const report = await this.reportsRepository.findOne({
            where: { id: Number(id) }
        });
        if (!report) {
            throw new NotFoundException(`El reporte con ID ${id} no se encontro`);
        }

        report.status = StateReport.Eliminado;
        await this.reportsRepository.save(report);

        await this.reportsRepository.softDelete(id);
        
        return { message: "Reporte eliminado correctamente" };
    }

    async resolveReport(id: number) {
        const report = await this.reportsRepository.findOne({
            where: { id },
        });

        if (!report) {
            throw new NotFoundException(`El reporte con ID ${id} no se encontro`);
        }

        report.status = StateReport.Resuelto;
        await this.reportsRepository.save(report);

        await this.reportsRepository.softDelete(id);
        return { message: "Reporte resuelto correctamente" };
    }

    async reactivateReport(id: number) {
        const report = await this.reportsRepository.findOne({
            where: { id },
            withDeleted: true,
        });

        if (!report) {
            throw new NotFoundException(`El reporte con ID ${id} no se encontro`);
        }

        const expires = new Date();
        expires.setHours(expires.getHours() + 2);

        report.status = StateReport.Activo;
        report.expires_at = expires;
        report.deleted_at = null as any;

        await this.reportsRepository.save(report);
        return { message: "Reporte reactivado correctamente" };
    }
}
