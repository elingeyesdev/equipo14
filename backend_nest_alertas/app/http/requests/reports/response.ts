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
    verified_at?: Date | null;
    verified_by?: { id: string; first_name: string; last_name: string } | null;
    distinct_contributors?: number;

    static FromReportToResponse(report: Report): ReportResponse {
        const response = new ReportResponse();

        response.id = report.id;
        response.creator = report.creator?.id ?? '';
        response.type = report.type;
        response.description = report.description ?? '';
        response.coordinates = report.location.coordinates;
        response.weight = report.weight ?? 0;
        response.verified = report.verified ?? false;
        response.created_at = report.created_at;
        response.expires_at = report.expires_at;
        response.zone = report.zone ?? 'Sin zona';
        response.images = ImageResponse.FromImageListToResponse(report.images);
        response.verified_at = report.verified_at ?? null;
        response.verified_by = report.verified_by
            ? {
                id: report.verified_by.id,
                first_name: report.verified_by.first_name ?? '',
                last_name: report.verified_by.last_name ?? '',
            }
            : null;

        const contributorIds = new Set<string>();
        if (report.creator?.id) contributorIds.add(report.creator.id);
        for (const img of report.images ?? []) {
            if (img.uploadedBy?.id) contributorIds.add(img.uploadedBy.id);
        }
        response.distinct_contributors = contributorIds.size;

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
