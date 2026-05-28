import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Report } from "app/models/report.entity";
import { Repository } from 'typeorm';

@Injectable()
export class ReportsCleanup {
    private readonly logger = new Logger(ReportsCleanup.name);

    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
    ) {}

    @Cron('')
    async removeExpiredReports(){
        const result = await this.reportsRepository
            .createQueryBuilder()
            .softDelete()
            .where('expires_at < NOW()')
            .andWhere('deleted_at IS NULL')
            .execute();
        if (result.affected) {
            this.logger.log(
                `${result.affected} reportes expirados eliminados`
            );
        }
    }
}