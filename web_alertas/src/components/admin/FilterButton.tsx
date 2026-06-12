import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterButtonProps {
  activeCount?: number;
  onClick: () => void;
}

export function FilterButton({ activeCount = 0, onClick }: FilterButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="rounded-xl gap-2 border-border cursor-pointer"
    >
      <SlidersHorizontal className="size-4" />
      Filtros
      {activeCount > 0 && (
        <span className="ml-0.5 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
          {activeCount}
        </span>
      )}
    </Button>
  );
}
