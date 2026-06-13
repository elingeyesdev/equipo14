export const FacilityType = {
    Policia: 'policia',
    Bombero: 'bombero',
    Hospital: 'hospital',
    Ambulancia: 'ambulancia',
} as const;

export type FacilityType = (typeof FacilityType)[keyof typeof FacilityType];
