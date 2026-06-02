import { ReportType } from "app/models/report-types.entity";
import { Report } from "app/models/report.entity";
import { ImageResponse } from "../images/response";
import { extractCoordinates } from "app/utils/geo.util";


// // datos a enviar si no existe un ReportType Asociado
// // de momento comentado
// const FALLBACK_TYPE: ReportType = {
//     id: 0,
//     name: 'Desconocido',
//     base_weight: 1,
//     reports: [],
// } as ReportType;

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

        response.id = report.id;
        response.creator = report.creator?.id ?? '';
        // // ejmplo implementado la clase
        // response.type = report.type ?? FALLBACK_TYPE;
        response.type = report.type;
        response.description = report.description ?? '';
        response.coordinates = extractCoordinates(report.location);
        response.weight = report.weight ?? 0;
        response.verified = report.verified ?? false;
        response.created_at = report.created_at;
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
        response.coordinates = extractCoordinates(report.location);
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
