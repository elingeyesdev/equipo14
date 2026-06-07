import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Report } from "app/models/report.entity";
import { log } from "console";
import { Repository } from 'typeorm';

@Injectable()
export class ReportsCleanup {
    private readonly logger = new Logger(ReportsCleanup.name);

    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
    ) {}

    // guia rapida por si te pierdes para esa mmda del cron
    // asi no tenes q consultar la documentacion a cada rato :P
    // CRON
    // * * * * *
    // │ │ │ │ │
    // │ │ │ │ └─ dia semana (0-7)
    // │ │ │ └─── mes
    // │ │ └───── dia mes
    // │ └─────── hora
    // └───────── minuto

    // en nuestro caso es cada media hora
    @Cron('* * * * *')
    async removeExpiredReports(){
        console.log("Se ejectuo del trabajo")
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