import { Switch } from "@/components/ui/switch";
import { facilityColor, facilityLabel } from "@/lib/facilities";
import type { EmergencyFacility } from "@/domain/types";

interface FacilitiesPanelProps {
  facilities: EmergencyFacility[];
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onFocusFacility?: (facility: EmergencyFacility) => void;
}

const TYPE_ORDER = ["policia", "bombero", "hospital", "ambulancia"];

export function FacilitiesPanel({
  facilities,
  enabled,
  onEnabledChange,
  onFocusFacility,
}: FacilitiesPanelProps) {
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: facilityLabel(type),
    color: facilityColor(type),
    items: facilities.filter((f) => f.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display font-bold text-sm">Instalaciones de emergencia</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Policía, bomberos, hospitales y ambulancias en Santa Cruz
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TYPE_ORDER.map((type) => (
          <span
            key={type}
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border border-border"
          >
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: facilityColor(type) }}
            />
            {facilityLabel(type)}
          </span>
        ))}
      </div>

      {facilities.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No hay instalaciones cargadas. Reinicia el backend para ejecutar el seed.
        </p>
      ) : (
        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
          {grouped.map((group) => (
            <div key={group.type}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                {group.label} · {group.items.length}
              </p>
              <ul className="space-y-2">
                {group.items.map((facility) => (
                  <li key={facility.id}>
                    <button
                      type="button"
                      onClick={() => onFocusFacility?.(facility)}
                      className="w-full flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <span
                        className="size-3 rounded-full shrink-0 ring-2 ring-background"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate">
                          {facility.name}
                        </span>
                        {facility.address && (
                          <span className="block text-[10px] text-muted-foreground truncate">
                            {facility.address}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
