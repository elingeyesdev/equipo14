import {IsIn, IsString,IsArray, IsNumber, ArrayMinSize, ArrayMaxSize, MaxLength } from "class-validator";
import { ReportTypes } from "../enums/report-type.enum";
import type { ReportType } from "../enums/report-type.enum";
import { ApiProperty } from "@nestjs/swagger";
import { Report } from "../entities/report.entity";

export class CreateReportRequest {
    @ApiProperty()
    @IsIn(Object.values(ReportTypes))
    type: ReportType ;

    @ApiProperty()
    @IsString()
    @MaxLength(250)
    description: string


    @ApiProperty()
    @IsString()
    user: string

    toReport(): Report{
        const report = new Report();
        report.type = this.type
        report.description = this.description
        report.location = {
            type: "Point",
            coordinates: [-63.1821, -17.7833]
            //coordinates: this.coordinates
        }
        return report
    }
}