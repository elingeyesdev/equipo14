import { IsIn, IsString, MaxLength, IsNumber } from 'class-validator';
import { ReportTypes, type ReportType } from '../enums/report-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Report } from '../entities/report.entity';
import { Transform } from 'class-transformer';

export class CreateReportRequest {
  @ApiProperty({ example: ReportTypes.Robo })
  @IsIn(Object.values(ReportTypes))
  type: ReportType;

  @ApiProperty()
  @IsString()
  @MaxLength(250)
  description: string;

  @ApiProperty({ description: 'UUID del usuario' })
  @IsString()
  user: string;

  @ApiProperty({ example: -63.1821, description: 'Longitud (WGS84), GeoJSON order' })
  @Transform(({ value }) => (value === '' || value === undefined ? value : Number(value)))
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: -17.7833, description: 'Latitud (WGS84)' })
  @Transform(({ value }) => (value === '' || value === undefined ? value : Number(value)))
  @IsNumber()
  latitude: number;

  toReport(): Report {
    const report = new Report();
    report.type = this.type;
    report.description = this.description;
    report.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
    return report;
  }
}
