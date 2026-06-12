import { Switch } from "@/components/ui/switch";
import { riskIndexToColor, type RiskZone } from "@/lib/risk-zones";

interface RiskZonesPanelProps {
  zones: RiskZone[];
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onFocusZone?: (zone: RiskZone) => void;
}

export function RiskZonesPanel({
  zones,
  enabled,
  onEnabledChange,
  onFocusZone,
}: RiskZonesPanelProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display font-bold text-sm">Índice de riesgo por zona</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Círculos generados desde incidentes reales · verde (bajo) → rojo (alto)
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      <div className="mb-4 h-2 rounded-full overflow-hidden flex">
        <div className="flex-1 bg-[rgb(34,197,94)]" title="Bajo" />
        <div className="flex-1 bg-[rgb(234,179,8)]" title="Medio" />
        <div className="flex-1 bg-[rgb(239,68,68)]" title="Alto" />
      </div>
      <div className="flex justify-between text-[9px] uppercase tracking-widest text-muted-foreground mb-4">
        <span>Bajo</span>
        <span>Medio</span>
        <span>Alto</span>
      </div>

      {zones.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No hay suficientes reportes con ubicación para calcular zonas.
        </p>
      ) : (
        <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {zones.slice(0, 12).map((zone) => (
            <li key={zone.id}>
              <button
                type="button"
                onClick={() => onFocusZone?.(zone)}
                className="w-full flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <span
                  className="size-3 rounded-full shrink-0 ring-2 ring-background"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">{zone.name}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {zone.reportCount} incidentes · {zone.accidentCount} accidentes
                  </span>
                </span>
                <span
                  className="text-xs font-bold tabular-nums shrink-0"
                  style={{ color: riskIndexToColor(zone.riskIndex) }}
                >
                  {Math.round(zone.riskIndex * 100)}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
