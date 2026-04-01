//segun un video de tiktok esto es mas limpio q un enum xd
//manitiene limpia la copilacion a javascript
export const ReportTypes = {
    Accidente: "accidente",
    Robo: "robo",
    Incendio: "incendio",
} as const;

export type ReportType = (typeof ReportTypes)[keyof typeof ReportTypes];