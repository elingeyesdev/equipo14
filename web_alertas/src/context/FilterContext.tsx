import { createContext, useContext, useState } from "react";

export interface Filters {
  search: string;
  category: string; // "Todos" | "Accidente" | "Robo" | "Incendio" | "Emergencia"
  status: string; // "Todos" | "Verificado" | "Pendiente"
  zone: string; // "Todas" | nombre de zona (texto en reporte)
  zoneId: string; // "" | ID de zona demarcada (polígono)
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  typeId: string; // Specific type ID
}

interface FilterContextType {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  clearFilters: () => void;
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
