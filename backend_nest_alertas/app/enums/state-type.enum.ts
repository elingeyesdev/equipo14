export const StateType = {
    EnCurso: 'en_curso',
    Completado: 'completado',
    Cancelado: 'cancelado',
} as const;

export type StateType = (typeof StateType)[keyof typeof StateType];
