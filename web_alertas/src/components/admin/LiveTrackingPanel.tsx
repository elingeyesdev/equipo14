import { Switch } from "@/components/ui/switch";
import type { LiveTracking } from "@/domain/tracking";
import { Radio, Navigation } from "lucide-react";

interface LiveTrackingPanelProps {
  trackings: LiveTracking[];
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  connected: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onFocus?: (tracking: LiveTracking) => void;
}

export function LiveTrackingPanel({
  trackings,
  enabled,
  onEnabledChange,
  connected,
  error,
  selectedId,
  onSelect,
  onFocus,
}: LiveTrackingPanelProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <Navigation className="size-4 text-primary" />
            Unidades en ruta
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Posición en vivo · ruta recalculada por calles (Mapbox)
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest">
        <Radio
          className={`size-3 ${connected && enabled ? "text-primary animate-pulse" : "text-muted-foreground"}`}
        />
        <span className={connected && enabled ? "text-primary" : "text-muted-foreground"}>
          {enabled ? (connected ? "En vivo" : "Conectando…") : "Capa oculta"}
        </span>
        {enabled && trackings.length > 0 && (
          <span className="ml-auto text-foreground">{trackings.length} activa(s)</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      )}

      {!enabled ? (
        <p className="text-xs text-muted-foreground py-2 text-center">
          Activa la capa para ver autoridades moviéndose en el mapa.
        </p>
      ) : trackings.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Ninguna unidad en ruta. Usa «Iniciar navegación» en móvil o{" "}
          <code className="text-[10px]">npm run simulate:tracking</code>.
        </p>
      ) : (
        <ul className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {trackings.map((tracking) => {
            const selected = tracking.id === selectedId;
            return (
              <li key={tracking.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(selected ? null : tracking.id);
                    onFocus?.(tracking);
                  }}
                  className={`w-full flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="size-9 rounded-full bg-blue-500 text-white grid place-items-center text-base shrink-0">
                    🚗
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">
                      {tracking.type || "Unidad de respuesta"}
                    </span>
                    <span className="block text-[10px] text-muted-foreground truncate">
                      {tracking.description || "En camino al incidente"}
                    </span>
                    <span className="block text-[9px] font-mono text-muted-foreground mt-1 truncate">
                      {tracking.reportId != null
                        ? `Reporte #${tracking.reportId} · `
                        : ""}
                      {tracking.route.length} pts · destino marcado
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
