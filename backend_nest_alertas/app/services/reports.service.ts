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
import {
    FilterReportsQuery,
    REPORT_CATEGORY_TYPE_IDS,
} from '../http/requests/reports/filter-query';
import { MIN_DISTINCT_CONTRIBUTORS_TO_VERIFY } from 'app/constants/security.constants';

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

    ){}

    async create(createReportRequest: CreateReportRequest, file: Express.Multer.File, authUserId: string){
        console.time('total');
        console.time('upload');
        const user = await this.usersRepository.findOne({where: {id: authUserId}})
        if(!user){
            throw new NotFoundException("Usuario no encontrado");
        }
        const type = await this.reportTypeRepository.findOne({where: {id: createReportRequest.type}})
        if(!type){
            throw new NotFoundException("Tipo no encontrado");
        }

        const expires = new Date();
        expires.setHours(expires.getHours() + 24);

        const createReport = createReportRequest.toReport();

        let initialWeight = type.base_weight || 1;
        if (createReportRequest.description.length > 100) initialWeight += 2;

        createReport.weight = initialWeight;
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

        console.time('notifications');
        await this.notificationsService.notifyNearbyUsers(savedReport);
        console.timeEnd('notifications');
        
        console.timeEnd('upload');

        console.timeEnd('total');
        return ReportResponse.FromReportToResponse(savedReport);
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

        const existingUploaders = new Set(
            (report.images ?? []).map((img) => img.uploadedBy?.id).filter(Boolean),
        );
        report.images.push(image);
        report.weight += existingUploaders.has(user.id) ? 1 : 2;

        const savedReport = await this.reportsRepository.save(report)

        return ReportResponse.FromReportToResponse(savedReport)
    }

    countDistinctContributors(report: Report): number {
        const ids = new Set<string>();
        if (report.creator?.id) ids.add(report.creator.id);
        for (const img of report.images ?? []) {
            if (img.uploadedBy?.id) ids.add(img.uploadedBy.id);
        }
        return ids.size;
    }

    async verifyReport(id: number, verifier: { id: string; role?: { name?: string } }) {
        const report = await this.reportsRepository.findOne({
            where: { id: Number(id) },
            relations: ['creator', 'type', 'images', 'images.uploadedBy', 'verified_by'],
        });
        if (!report) {
            throw new NotFoundException('Reporte no encontrado');
        }

        const distinct = this.countDistinctContributors(report);
        const isAdmin = verifier.role?.name?.toLowerCase() === 'admin';
        if (distinct < MIN_DISTINCT_CONTRIBUTORS_TO_VERIFY && !isAdmin) {
            throw new BadRequestException(
                `Se requieren al menos ${MIN_DISTINCT_CONTRIBUTORS_TO_VERIFY} usuarios distintos con evidencia fotográfica (actual: ${distinct})`,
            );
        }

        const verifierUser = await this.usersRepository.findOne({ where: { id: verifier.id } });
        if (!verifierUser) {
            throw new NotFoundException('Usuario verificador no encontrado');
        }

        report.verified = true;
        report.verified_at = new Date();
        report.verified_by = verifierUser;

        const savedReport = await this.reportsRepository.save(report);

        const fullReport = await this.reportsRepository.findOne({
            where: { id: savedReport.id },
            relations: ['creator', 'type', 'images', 'images.uploadedBy', 'verified_by'],
        });
        if (fullReport) {
            await this.notificationsService.notifyReportVerified(fullReport);
        }

        return ReportResponse.FromReportToResponse(fullReport ?? savedReport);
    }

    async findOne(id: string) {
        const report = await this.reportsRepository.findOne({
            where: {id: Number(id)},
            relations: ['creator','images','images.uploadedBy', 'type', 'verified_by']
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

    async findAll(
        filters?: FilterReportsQuery,
        user?: { role?: { name?: string } },
    ) {
        const qb = this.reportsRepository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.creator', 'creator')
            .leftJoinAndSelect('report.type', 'type')
            .leftJoinAndSelect('report.verified_by', 'verified_by')
            .leftJoinAndSelect('report.images', 'images')
            .leftJoinAndSelect('images.uploadedBy', 'uploadedBy');

        const role = user?.role?.name?.toLowerCase();
        const isStaff = role === 'admin' || role === 'autoridad';
        if (filters?.includeDeleted === 'true' && isStaff) {
            qb.withDeleted();
        }

        if (filters?.typeId) {
            qb.andWhere('type.id = :typeId', { typeId: Number(filters.typeId) });
        }

        if (filters?.category && REPORT_CATEGORY_TYPE_IDS[filters.category]) {
            qb.andWhere('type.id IN (:...categoryIds)', {
                categoryIds: REPORT_CATEGORY_TYPE_IDS[filters.category],
            });
        }

        if (filters?.status === 'verified') {
            qb.andWhere('report.verified = true');
        } else if (filters?.status === 'pending') {
            qb.andWhere('report.verified = false');
        }

        if (filters?.zoneId) {
            qb.andWhere(
                `ST_Contains(
                    (SELECT z.boundary FROM zone z WHERE z.id = :zoneId),
                    report.location
                )`,
                { zoneId: Number(filters.zoneId) },
            );
        } else if (filters?.zone && filters.zone !== 'all') {
            qb.andWhere('TRIM(report.zone) = :zone', { zone: filters.zone.trim() });
        }

        if (filters?.from) {
            qb.andWhere('report.created_at >= :from', {
                from: new Date(`${filters.from}T00:00:00`),
            });
        }

        if (filters?.to) {
            qb.andWhere('report.created_at <= :to', {
                to: new Date(`${filters.to}T23:59:59`),
            });
        }

        if (filters?.search?.trim()) {
            const q = `%${filters.search.trim().toLowerCase()}%`;
            qb.andWhere(
                `(LOWER(report.description) LIKE :q OR LOWER(report.zone) LIKE :q OR LOWER(type.name) LIKE :q OR CAST(report.id AS TEXT) LIKE :q)`,
                { q },
            );
        }

        const reports = await qb.orderBy('report.created_at', 'DESC').getMany();
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
            .orderBy('report.created_at', 'DESC')
            .getMany();

            console.log(reports)
            console.log(latitude, longitude)
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
        return ReportCoinicdenceResponse.FromReportListToResponse(usersCoincidence)
    }

    async remove(id: string, deletedById: string){
        const report = await this.reportsRepository.findOne({ where: { id: Number(id) } });
        if (!report) {
            throw new NotFoundException(`El reporte con ID ${id} no se encontro`);
        }

        const deletedBy = await this.usersRepository.findOne({ where: { id: deletedById } });
        if (deletedBy) {
            report.deleted_by = deletedBy;
            await this.reportsRepository.save(report);
        }

        const result = await this.reportsRepository.softDelete(id);

        if(result.affected === 0){
            throw new NotFoundException(`El reporte con ID ${id} no se encontro`)
        }
        return { message: "Reporte eliminado correctamente" };
    }
}
