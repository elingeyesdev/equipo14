import { Image } from "app/models/image.entity";
import { ReportType } from "app/models/report-types.entity";
import { Report } from "app/models/report.entity";
import { ImageResponse } from "../images/response";

export class ReportResponse{
    id: number;
    creator: string;
    type: ReportType;
    description: string;
    coordinates: number[];
    weight: number;
    verified: boolean;
    created_at: Date;
    expires_at: Date;
    zone: string;
    images: ImageResponse[];

    static FromReportToResponse(report: Report): ReportResponse {
        const response = new ReportResponse();

        response.id = report.id
        response.creator = report.creator.id
        response.type = report.type
        response.description = report.description
        response.coordinates = report.location.coordinates
        response.weight = report.weight
        response.verified = report.verified
        response.created_at = report.created_at
        response.expires_at = report.expires_at
        response.zone = report.zone
        response.images = ImageResponse.FromImageListToResponse(report.images)

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
    verified: boolean;
    created_at: Date;
    images: ImageResponse[];
    zone: string;

    static FromReportToResponse(report: Report): ReportCoinicdenceResponse {
        const response = new ReportCoinicdenceResponse();

        response.id = report.id
        response.description = report.description
        response.coordinates = report.location.coordinates
        response.weight = report.weight
        response.verified = report.verified
        response.created_at = report.created_at
        response.zone = report.zone
        response.images = ImageResponse.FromImageListToResponse(report.images)

        return response
    }

    static FromReportListToResponse(reports: Report[]): ReportCoinicdenceResponse[]{
        return reports.map(report => this.FromReportToResponse(report));
    }
}