export const InstallationType = {
    Policia: 'policia',
    Bombero: 'bombero',
    Hospital: 'hospital',
} as const;

export type InstallationType = (typeof InstallationType)[keyof typeof InstallationType];
