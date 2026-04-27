import { Image } from "app/models/image.entity";
import { ReportType } from "app/models/report-types.entity";
import { Report } from "app/models/report.entity";

export class ReportResponse{
    id: number;
    user_uuid: string;
    type: ReportType;
    description: string;
    coordinates: number[];
    weight: number;
    created_at: Date;
    expires_at: Date;
    images: Image[]

    static FromReportToResponse(report: Report): ReportResponse {
        const response = new ReportResponse();

        response.id = report.id
        response.user_uuid = report.user.id
        response.type = report.type
        response.description = report.description
        response.coordinates = report.location.coordinates
        response.weight = report.weight
        response.created_at = report.created_at
        response.expires_at = report.expires_at
        response.images = report.images

        return response
    }

    static FromReportListToResponse(reports: Report[]): ReportResponse[]{
        return reports.map(report => this.FromReportToResponse(report));
    }
}

export class ReportCoinicdenceResponse{
    id: number;
    description: string;
    coordinates: number[];
    weight: number;
    created_at: Date;
    images: Image[]

    static FromReportToResponse(report: Report): ReportCoinicdenceResponse {
        const response = new ReportCoinicdenceResponse();

        response.id = report.id
        response.description = report.description
        response.coordinates = report.location.coordinates
        response.weight = report.weight
        response.created_at = report.created_at
        response.images = report.images

        return response
    }

    static FromReportListToResponse(reports: Report[]): ReportCoinicdenceResponse[]{
        return reports.map(report => this.FromReportToResponse(report));
    }
}