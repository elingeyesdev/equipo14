import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FiltersBar } from "@/components/admin/FiltersBar";

interface ReportsFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportsFilterSheet({ open, onOpenChange }: ReportsFilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="font-display">Filtros de reportes</SheetTitle>
          <SheetDescription>
            Acota incidentes por categoría, estado, zona y rango de fechas.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6">
          <FiltersBar onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
