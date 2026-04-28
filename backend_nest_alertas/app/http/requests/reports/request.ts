import {IsString, IsNumber, MaxLength } from "class-validator";
import { Report } from "../../../models/report.entity";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

//Nota: parece ser q los `@ApiProperty()` ya no tienen ningun efecto o utilidad, revisar

export class CreateReportRequest {
    @Type(() => Number)
    @IsNumber()
    type: number

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
    userId: string
    
    toReport(): Report{
        const report = new Report();
        report.description = this.description
        report.location = {
            type: "Point",
            coordinates: [this.longitude, this.latitude]
        }
        return report
    }
}


export class VerifyReportRequest{
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    type: number

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    latitude: number;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    longitude: number;
}