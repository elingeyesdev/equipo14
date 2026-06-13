import type { Report } from "@/domain/types";

/** Reportes sin actividad reciente no se muestran en el mapa. */
export const REPORT_MAP_STALE_MS = 2 * 60 * 60 * 1000;

export function getReportLastActivityAt(report: Report): Date {
  const created = new Date(report.created_at).getTime();
  const updated = report.updated_at
    ? new Date(report.updated_at).getTime()
    : created;

  const imageTimes = (report.images ?? [])
    .map((img) => (img.uploaded_at ? new Date(img.uploaded_at).getTime() : 0))
    .filter((t) => t > 0);

  const latestImage = imageTimes.length ? Math.max(...imageTimes) : 0;
  return new Date(Math.max(created, updated, latestImage));
}

export function isReportVisibleOnMap(report: Report, now = Date.now()): boolean {
  const lastActivity = getReportLastActivityAt(report).getTime();
  return now - lastActivity <= REPORT_MAP_STALE_MS;
}

export function filterReportsForMap(reports: Report[]): Report[] {
  return reports.filter(isReportVisibleOnMap);
}
