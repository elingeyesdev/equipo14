import { Switch } from "@/components/ui/switch";
import { stationColor, stationLabel } from "@/lib/emergency-station";
import type { EmergencyStation } from "@/domain/types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EmergencyStationsPanelProps {
  stations: EmergencyStation[];
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onFocusStation?: (station: EmergencyStation) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const TYPE_ORDER = ["policia", "bombero", "hospital"];

export function EmergencyStationsPanel({
  stations,
  enabled,
  onEnabledChange,
  onFocusStation,
  isExpanded = false,
  onToggleExpand,
}: EmergencyStationsPanelProps) {
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: stationLabel(type),
    color: stationColor(type),
    items: stations.filter((s) => s.installation_type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div
          className="flex-1 cursor-pointer select-none group"
          onClick={onToggleExpand}
        >
          <h3 className="font-display font-bold text-sm flex items-center gap-1.5 group-hover:text-primary transition-colors">
            Estaciones de emergencia
            {isExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Policía, bomberos y hospitales en Santa Cruz
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap gap-2 mb-4">
            {TYPE_ORDER.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border border-border"
              >
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: stationColor(type) }}
                />
                {stationLabel(type)}
              </span>
            ))}
          </div>

          {stations.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No hay estaciones cargadas. Reinicia el backend para ejecutar el seed.
            </p>
          ) : (
            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
              {grouped.map((group) => (
                <div key={group.type}>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                    {group.label} · {group.items.length}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map((station) => (
                      <li key={station.id}>
                        <button
                          type="button"
                          onClick={() => onFocusStation?.(station)}
                          className="w-full flex items-center gap-3 rounded-xl border border-border/40 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <span
                            className="size-3 rounded-full shrink-0 ring-2 ring-background"
                            style={{ backgroundColor: group.color }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium truncate">
                              {station.name}
                            </span>
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
      )}
    </div>
  );
}
