export const ReportTypes = {
  Accidente: 'accidente',
  Robo: 'robo',
  Incendio: 'incendio',
} as const;

export type ReportType = (typeof ReportTypes)[keyof typeof ReportTypes];

/** Valores para columna enum en PostgreSQL / TypeORM */
export const REPORT_TYPE_VALUES: ReportType[] = [
  ReportTypes.Accidente,
  ReportTypes.Robo,
  ReportTypes.Incendio,
];