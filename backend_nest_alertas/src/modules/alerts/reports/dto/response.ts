import { Report } from "../entities/report.entity";

export class ReportResponse{
    id: number;
    type: string;
    description: string;
    coordinates: number[];
    weight: number;
    created_at: Date;
    expires_at: Date;
    user_uuid: string;

    static FromReportToResponse(report: Report): ReportResponse {
        const response = new ReportResponse();

        response.id = report.id
        response.type = report.type
        response.description = report.description
        response.coordinates = report.location.coordinates
        response.weight = report.weight
        response.created_at = report.created_at
        response.expires_at = report.expires_at
        response.user_uuid = report.user.id 

        return response
    }

    static FromReportListToResponse(reports: Report[]): ReportResponse[]{
        return reports.map(report => this.FromReportToResponse(report));
    }
}