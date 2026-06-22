import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Report } from "app/models/report.entity";
import { Repository } from 'typeorm';
import { StateReport } from "app/enums/state-report.enum";

@Injectable()
export class ReportsCleanup {
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
    @Cron('*/30 * * * *')
    async removeExpiredReports(){
        console.log("Se ejectuo del trabajo")
        const result = await this.reportsRepository
            .createQueryBuilder()
            .update(Report)
            .set({
                status: StateReport.Vencido,
                deleted_at: () => 'NOW()'
            })
            .where('expires_at < NOW()')
            .andWhere('deleted_at IS NULL')
            .execute();
        if (result.affected) {
            console.log(
                `${result.affected} reportes expirados marcados como vencidos y eliminados`
            );
        }
    }
}