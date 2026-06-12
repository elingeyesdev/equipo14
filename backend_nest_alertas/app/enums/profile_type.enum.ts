//segun un video de tiktok esto es mas limpio q un enum xd
//manitiene limpia la copilacion a javascript
export const ProfileType = {
    Policia: "policia",
    Bombero: "bombero",
    Paramedico: "paramedico",
} as const;

export type ProfileType = (typeof ProfileType)[keyof typeof ProfileType];