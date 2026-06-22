import { ReportType } from "app/models/report-types.entity";
import { Report } from "app/models/report.entity";
import { ImageResponse } from "../images/response";
import { StateReport } from "app/enums/state-report.enum";

export class ReportResponse{
    id: number;
    creator: string;
    type: ReportType;
    description: string;
    status: StateReport;
    coordinates: number[];
    weight: number;
    verified: boolean;
    created_at: Date;
    updated_at: Date;
    expires_at: Date;
    zone: string;
    images: ImageResponse[];   

    static FromReportToResponse(report: Report): ReportResponse {
        const response = new ReportResponse();

        response.id = report.id;
        response.creator = report.creator?.id ?? '';
        response.type = report.type;
        response.description = report.description ?? '';
        response.status = report.status;
        response.coordinates = report.location.coordinates;
        response.weight = report.weight ?? 0;
        response.verified = report.verified ?? false;
        response.created_at = report.created_at;
        response.updated_at = report.updated_at ?? report.created_at;
        response.expires_at = report.expires_at;
        response.zone = report.zone ?? 'Sin zona';
        response.images = ImageResponse.FromImageListToResponse(report.images);
        
        return response;
    }

    static FromReportListToResponse(reports: Report[]): ReportResponse[]{
        if (!reports?.length) return [];
        return reports.map((report) => this.FromReportToResponse(report));
    }
}

export class ReportCoinicdenceResponse{
    id: number;
    description: string;
    coordinates: number[];
    weight: number;
    verified: boolean;
    created_at: Date;
    images: ImageResponse[];
    zone: string;

    static FromReportToResponse(report: Report): ReportCoinicdenceResponse {
        const response = new ReportCoinicdenceResponse();

        response.id = report.id;
        response.description = report.description ?? '';
        response.coordinates = report.location.coordinates;
        response.weight = report.weight ?? 0;
        response.verified = report.verified ?? false;
        response.created_at = report.created_at;
        response.zone = report.zone ?? 'Sin zona';
        response.images = ImageResponse.FromImageListToResponse(report.images);

        return response;
    }

    static FromReportListToResponse(reports: Report[]): ReportCoinicdenceResponse[]{
        if (!reports?.length) return [];
        return reports.map((report) => this.FromReportToResponse(report));
    }
}
