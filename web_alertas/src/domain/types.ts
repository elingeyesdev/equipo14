export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: Role;
}

export interface ReportType {
  id: number;
  name: string;
  base_weight: number;
}

export interface ReportImage {
  id: number;
  url: string;
}

export interface Report {
  id: number;
  creator: string;
  type: ReportType;
  description: string;
  coordinates: number[]; // [lng, lat]
  weight: number;
  verified: boolean;
  created_at: string;
  expires_at: string;
  zone: string;
  images: ReportImage[];
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface Zone {
  id: number;
  name: string;
  color: string;
  /** Anillo exterior [lng, lat][] */
  coordinates: number[][];
  created_at: string;
}
