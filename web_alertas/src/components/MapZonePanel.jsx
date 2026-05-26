import { useMemo } from 'react'
import { computeZoneRegions } from '../utils/zones'

export default function MapZonePanel({ reports, selectedZone, onZoneSelect }) {
  const zones = useMemo(() => computeZoneRegions(reports), [reports])

  if (zones.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)] py-4 text-center leading-relaxed">
        Sin zonas con reportes.
        <br />
        <span className="text-xs">
          Crea alertas desde la app móvil o verifica que el backend esté activo.
        </span>
      </p>
    )
  }

  return (
    <ul className="space-y-1.5 max-h-[320px] overflow-y-auto">
      <li>
        <button
          type="button"
          onClick={() => onZoneSelect(null)}
          className={`w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            !selectedZone
              ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
              : 'text-[var(--body)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          Todas las zonas
          <span className="float-right text-xs opacity-70">{reports.length}</span>
        </button>
      </li>
      {zones.map((zone) => (
        <li key={zone.name}>
          <button
            type="button"
            onClick={() => onZoneSelect(zone.name)}
            className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
              selectedZone === zone.name
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--body)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: zone.color }}
              />
              <span className="font-medium truncate">{zone.name}</span>
            </span>
            <span className="mt-0.5 block text-xs opacity-70 pl-4">
              {zone.count} alertas · {zone.verified} verificadas
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
