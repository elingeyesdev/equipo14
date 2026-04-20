import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportTypeController } from "app/http/controllers/report-types.controller";
import { ReportType } from "app/models/report-types.entity";
import { ReportTypesService } from "app/services/report-types.service";

@Module({
    imports: [TypeOrmModule.forFeature([ReportType])],
    providers: [ReportTypesService],
    controllers: [ReportTypeController]
})
export class ReportTypesModule{}