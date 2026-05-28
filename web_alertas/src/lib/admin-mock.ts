export type IncidentStatus = "Verificado" | "Pendiente";

export type Incident = {
  id: number;
  type: string;
  category: "Accidente" | "Robo" | "Incendio" | "Emergencia";
  description: string;
  zone: string;
  status: IncidentStatus;
  date: string;
};

export const incidents: Incident[] = [
  {
    id: 7,
    type: "Incendio estructural",
    category: "Incendio",
    description: "se quema el fidalga",
    zone: "fidalga",
    status: "Verificado",
    date: "28/5/2026 · 8:02 a.m.",
  },
  {
    id: 6,
    type: "Accidente de tránsito",
    category: "Accidente",
    description: "se chocaron 3 autos",
    zone: "canal isuto",
    status: "Verificado",
    date: "28/5/2026 · 1:33 a.m.",
  },
  {
    id: 5,
    type: "Hurto",
    category: "Robo",
    description: "me robaron",
    zone: "24 de Septiembre",
    status: "Pendiente",
    date: "25/5/2026 · 4:38 p.m.",
  },
  {
    id: 4,
    type: "Hurto",
    category: "Robo",
    description: "me robaron",
    zone: "24 de Septiembre",
    status: "Verificado",
    date: "25/5/2026 · 4:37 p.m.",
  },
  {
    id: 3,
    type: "Robo a mano armada",
    category: "Robo",
    description: "ayuda",
    zone: "Zona desconocida",
    status: "Verificado",
    date: "19/5/2026 · 1:28 p.m.",
  },
  {
    id: 2,
    type: "Robo a mano armada",
    category: "Robo",
    description: "robo con PISTOLS",
    zone: "Séptimo Anillo",
    status: "Verificado",
    date: "19/5/2026 · 1:23 p.m.",
  },
  {
    id: 1,
    type: "Robo a mano armada",
    category: "Robo",
    description: "robo con pistola",
    zone: "Séptimo Anillo",
    status: "Pendiente",
    date: "19/5/2026 · 1:22 p.m.",
  },
];

export const zones = [
  { name: "24 de Septiembre", alerts: 2, verified: 1, color: "bg-sky-400" },
  { name: "Séptimo Anillo", alerts: 2, verified: 1, color: "bg-amber-400" },
  { name: "fidalga", alerts: 1, verified: 1, color: "bg-violet-400" },
  { name: "canal isuto", alerts: 1, verified: 1, color: "bg-rose-400" },
  { name: "Zona desconocida", alerts: 1, verified: 1, color: "bg-orange-300" },
];

export const categories: Array<{ key: "Todos" | Incident["category"]; label: string }> = [
  { key: "Todos", label: "Todos" },
  { key: "Accidente", label: "Accidentes" },
  { key: "Robo", label: "Robos y hurtos" },
  { key: "Incendio", label: "Incendios" },
  { key: "Emergencia", label: "Emergencias" },
];