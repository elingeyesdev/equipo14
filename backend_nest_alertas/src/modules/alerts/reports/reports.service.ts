import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateReportRequest } from './dto/request';
import { ReportResponse } from './dto/response';
import { ImagesService } from '../images/images.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private imagesServices: ImagesService,
  ) {}

  async create(createReportRequest: CreateReportRequest, file?: Express.Multer.File) {
    const user = await this.usersRepository.findOne({
      where: { id: createReportRequest.user },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const now = new Date();
    const expires = new Date();
    expires.setHours(now.getHours() + 24);

    const createReport = createReportRequest.toReport();

    createReport.weight = 0;
    createReport.expires_at = expires;
    createReport.user = user;

    const newReport = this.reportsRepository.create(createReport);
    const savedReport = await this.reportsRepository.save(newReport);

    if (file?.buffer?.length) {
      await this.imagesServices.create(savedReport, file);
    }

    const full = await this.reportsRepository.findOne({
      where: { id: savedReport.id },
      relations: ['user', 'images'],
    });
    if (!full) {
      throw new BadRequestException('No se pudo recargar el reporte');
    }
    return ReportResponse.FromReportToResponse(full);
  }

  async findAll() {
    const reports = await this.reportsRepository.find({
      relations: ['user', 'images'],
    });
    return ReportResponse.FromReportListToResponse(reports);
  }

  async findOne(id: string) {
    const report = await this.reportsRepository.findOne({
      where: { id: Number(id) },
      relations: ['user', 'images'],
    });
    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }
    return ReportResponse.FromReportToResponse(report);
  }

  async remove(id: string) {
    const result = await this.reportsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`El reporte con ID ${id} no se encontro`);
    }
    return { message: 'Reporte eliminado correctamente' };
  }
}
