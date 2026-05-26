import { ChevronDown, Crosshair, MapPin, Radar, RotateCcw } from 'lucide-react'
import { RADIUS_KM_MAX, RADIUS_KM_MIN } from '../../utils/geo'

export default function MapRadiusControls({
  radiusMode,
  onRadiusModeChange,
  radiusKm,
  onRadiusKmChange,
  reportCount,
  referenceLabel,
  isPlacingReference,
  onStartPlacingReference,
  onCancelPlacing,
  onConfirmReference,
  onResetReference,
  onUseMyLocation,
  hasCustomReference,
  panelOpen,
  onPanelOpenChange,
}) {
  return (
    <div className="map-radius-controls">
      <button
        type="button"
        className="map-radius-controls__header"
        onClick={() => onPanelOpenChange(!panelOpen)}
        aria-expanded={panelOpen}
      >
        <span className="map-radius-controls__icon">
          <Radar className="h-5 w-5" />
        </span>
        <span className="map-radius-controls__titles">
          <span className="map-radius-controls__subtitle">
            {radiusMode ? 'Filtrar por radio' : 'Todos los reportes'}
          </span>
          <span className="map-radius-controls__value">
            {radiusMode ? (
              <>
                {radiusKm % 1 === 0 ? radiusKm.toFixed(0) : radiusKm.toFixed(1)} km
                <span className="map-radius-controls__count">{reportCount}</span>
              </>
            ) : (
              <>
                Vista completa
                <span className="map-radius-controls__count">{reportCount}</span>
              </>
            )}
          </span>
        </span>
        <ChevronDown
          className={`h-6 w-6 shrink-0 opacity-60 transition-transform ${panelOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {panelOpen && (
        <div className="map-radius-controls__body">
          <label className="map-radius-controls__toggle-row">
            <input
              type="checkbox"
              checked={radiusMode}
              onChange={(e) => onRadiusModeChange(e.target.checked)}
            />
            <span>Activar filtro por radio (como en la app móvil)</span>
          </label>

          {radiusMode && (
            <>
              <p className="map-radius-controls__hint">
                El círculo en el mapa coincide con el área de búsqueda. Solo se muestran
                incidentes dentro del radio.
              </p>

              <div className="map-radius-controls__slider-row">
                <span className="text-xs text-[var(--muted)]">Radio</span>
                <span className="text-sm font-bold text-[var(--accent)]">
                  {radiusKm % 1 === 0 ? `${radiusKm.toFixed(0)} km` : `${radiusKm.toFixed(1)} km`}
                </span>
              </div>
              <input
                type="range"
                min={RADIUS_KM_MIN}
                max={RADIUS_KM_MAX}
                step={0.5}
                value={radiusKm}
                onChange={(e) => onRadiusKmChange(Number(e.target.value))}
                className="map-radius-controls__slider w-full"
              />
              <div className="flex justify-between text-[10px] text-[var(--muted)]">
                <span>{RADIUS_KM_MIN} km</span>
                <span>{RADIUS_KM_MAX} km</span>
              </div>
            </>
          )}

          <hr className="map-radius-controls__divider" />

          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]">
              <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
              Punto de referencia
            </span>
            {hasCustomReference && radiusMode && (
              <button
                type="button"
                onClick={onResetReference}
                className="text-[10px] font-bold uppercase tracking-wide text-[var(--danger)]"
              >
                Restablecer
              </button>
            )}
          </div>

          <p className="map-radius-controls__hint">
            {referenceLabel}
            {!radiusMode && ' (solo aplica con filtro por radio activo)'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="map-radius-controls__btn map-radius-controls__btn--secondary"
              onClick={onUseMyLocation}
              disabled={!radiusMode}
            >
              <Crosshair className="h-3.5 w-3.5" />
              Mi ubicación
            </button>
            {!isPlacingReference ? (
              <button
                type="button"
                className="map-radius-controls__btn map-radius-controls__btn--primary"
                onClick={onStartPlacingReference}
                disabled={!radiusMode}
              >
                Elegir en el mapa
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="map-radius-controls__btn map-radius-controls__btn--secondary"
                  onClick={onCancelPlacing}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="map-radius-controls__btn map-radius-controls__btn--primary"
                  onClick={onConfirmReference}
                >
                  Confirmar punto
                </button>
              </>
            )}
          </div>

          {isPlacingReference && (
            <p className="map-radius-controls__placing">
              Toca el mapa para colocar el punto de referencia
            </p>
          )}
        </div>
      )}
    </div>
  )
}
