export interface Role {
  id: number;
  name: string;
}

export const ProfileType = {
  Policia: "policia",
  Bombero: "bombero",
  Paramedico: "paramedico",
} as const;

export type ProfileType = (typeof ProfileType)[keyof typeof ProfileType];

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: Role;
  authority_profile: {
    ci: string;
    gmail: string;
    profile_type: string;
  } | null;
}

export interface ReportType {
  id: number;
  name: string;
  base_weight: number;
}

export interface ReportImageUploader {
  id: string;
  first_name: string;
  last_name: string;
}

export interface ReportImage {
  id: number;
  url: string;
  uploaded_at?: string;
  uploadedBy?: ReportImageUploader;
}

export interface ReportVerifier {
  id: string;
  first_name: string;
  last_name: string;
}

export type StateReport = "activo" | "resuelto" | "vencido" | "eliminado";

export interface ReportDispatch {
  attended_by: User | null;
  recorded_at: string;
  state: string;
}

export interface Report {
  id: number;
  creator: string;
  type: ReportType;
  description: string;
  coordinates: number[];
  weight: number;
  verified: boolean;
  created_at: string;
  updated_at?: string;
  expires_at: string;
  zone: string;
  images: ReportImage[];
  status: StateReport;
  verified_at?: string | null;
  verified_by?: ReportVerifier | null;
  distinct_contributors?: number;
  dispatches?: ReportDispatch[];
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}


export interface EmergencyStation {
  id: number;
  name: string;
  installation_type: string;
  coordinates: number[];
  distance_meters?: number;
}
