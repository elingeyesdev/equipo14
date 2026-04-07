import {IsIn, IsString,IsArray, IsNumber, ArrayMinSize, ArrayMaxSize, MaxLength } from "class-validator";
import { ReportTypes, type ReportType } from "../../../enums/report-type.enum";
import { ApiProperty } from "@nestjs/swagger";
import { Report } from "../../../models/report.entity";
import { Type } from "class-transformer";

//Nota: parece ser q los `@ApiProperty()` ya no tienen ningun efecto o utilidad, revisar

export class CreateReportRequest {
    @IsIn(Object.values(ReportTypes))
    type: ReportType ;

    @IsString()
    @MaxLength(250)
    description: string

    @Type(() => Number)
    @IsNumber()
    latitude: number;

    @Type(() => Number)
    @IsNumber()
    longitude: number;

    @IsString()
    user: string
    
    toReport(): Report{
        const report = new Report();
        report.type = this.type
        report.description = this.description
        report.location = {
            type: "Point",
            coordinates: [this.latitude, this.longitude]
        }
        return report
    }
}