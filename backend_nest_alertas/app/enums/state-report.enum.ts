export const StateReport = {
    Activo: 'activo',
    Resuelto: 'resuelto',
    Vencido: 'vencido',
    Eliminado: 'eliminado',
} as const;

export type StateReport = (typeof StateReport)[keyof typeof StateReport];
