import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface Filters {
  search: string;
  category: string;
  status: string;
  zone: string;
  zoneId: string;
  from: string;
  to: string;
  typeId: string;
}

export const DEFAULT_FILTERS: Filters = {
  search: "",
  category: "Todos",
  status: "Todos",
  zone: "Todas",
  zoneId: "",
  from: "",
  to: "",
  typeId: "",
};

interface FilterContextType {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  clearFilters: () => void;
  activeCount: number;
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function countActiveFilters(filters: Filters): number {
  let count = 0;
  if (filters.search.trim()) count++;
  if (filters.category && filters.category !== "Todos") count++;
  if (filters.status && filters.status !== "Todos") count++;
  if (filters.zone && filters.zone !== "Todas") count++;
  if (filters.zoneId) count++;
  if (filters.from) count++;
  if (filters.to) count++;
  if (filters.typeId) count++;
  return count;
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      clearFilters: () => setFilters(DEFAULT_FILTERS),
      activeCount: countActiveFilters(filters),
    }),
    [filters],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
