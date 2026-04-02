import { Report } from '../entities/report.entity';

export class ImageInReportResponse {
  id: number;
  url: string;
  uploaded_at: Date;
}

export class ReportResponse {
  id: number;
  user_uuid: string;
  type: string;
  description: string;
  coordinates: number[];
  weight: number;
  created_at: Date;
  expires_at: Date;
  images: ImageInReportResponse[];

  static FromReportToResponse(report: Report): ReportResponse {
    const response = new ReportResponse();

    response.id = report.id;
    response.user_uuid = report.user?.id;
    response.type = report.type;
    response.description = report.description;
    response.coordinates = report.location?.coordinates ?? [];
    response.weight = report.weight;
    response.created_at = report.created_at;
    response.expires_at = report.expires_at;
    response.images =
      report.images?.map((img) => ({
        id: img.id,
        url: img.url,
        uploaded_at: img.uploaded_at,
      })) ?? [];

    return response;
  }

  static FromReportListToResponse(reports: Report[]): ReportResponse[] {
    return reports.map((report) => this.FromReportToResponse(report));
  }
}
