import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface SimpleListFiltersState {
  search: string;
  role: string;
}

export const DEFAULT_SIMPLE_FILTERS: SimpleListFiltersState = {
  search: "",
  role: "Todos",
};

export function countSimpleFilters(filters: SimpleListFiltersState): number {
  let count = 0;
  if (filters.search.trim()) count++;
  if (filters.role && filters.role !== "Todos") count++;
  return count;
}

interface SimpleListFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  filters: SimpleListFiltersState;
  onChange: (next: SimpleListFiltersState) => void;
  showRoleFilter?: boolean;
  resultCount?: number;
}

export function SimpleListFilters({
  open,
  onOpenChange,
  title,
  description,
  filters,
  onChange,
  showRoleFilter = false,
  resultCount,
}: SimpleListFiltersProps) {
  const handleClear = () => onChange(DEFAULT_SIMPLE_FILTERS);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {resultCount != null && (
            <p className="text-xs text-muted-foreground">{resultCount} resultados con los filtros actuales</p>
          )}

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Buscar
            </span>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Nombre, teléfono, texto..."
                value={filters.search}
                onChange={(e) => onChange({ ...filters, search: e.target.value })}
                className="w-full h-10 pl-10 pr-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </label>

          {showRoleFilter && (
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Rol
              </span>
              <select
                value={filters.role}
                onChange={(e) => onChange({ ...filters, role: e.target.value })}
                className="mt-1.5 w-full h-10 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer"
              >
                <option value="Todos">Todos los roles</option>
                <option value="usuario">Usuario normal</option>
                <option value="autoridad">Autoridad</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="w-full rounded-xl gap-2 border-dashed cursor-pointer"
          >
            <X className="size-4" />
            Limpiar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function applySimpleListFilters<T>(
  items: T[],
  filters: SimpleListFiltersState,
  matcher: (item: T, search: string) => boolean,
  roleMatcher?: (item: T, role: string) => boolean,
): T[] {
  return items.filter((item) => {
    const searchOk = !filters.search.trim() || matcher(item, filters.search.trim().toLowerCase());
    const roleOk =
      !roleMatcher || filters.role === "Todos" || roleMatcher(item, filters.role.toLowerCase());
    return searchOk && roleOk;
  });
}
