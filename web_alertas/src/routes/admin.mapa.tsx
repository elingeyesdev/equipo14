import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Layers,
  Radio,
  MapPin,
  Plus as ZoomIn,
  Minus,
  Maximize2,
  Check,
  X,
  PlusCircle,
  Crosshair,
  Circle,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/context/FilterContext";
import { useReports } from "@/hooks/useReports";
import { CreateAlertSheet } from "@/components/admin/CreateAlertSheet";
import { SaveZoneDialog } from "@/components/admin/SaveZoneDialog";
import type { MapLocation } from "@/components/admin/LocationPickerMap";
import {
  loadMapboxGl,
  MAPBOX_STYLE,
  SANTA_CRUZ_CENTER,
  attachMapResizeObserver,
  burstMapResize,
} from "@/lib/mapbox";
import { useZones } from "@/hooks/useZones";
import { useMapboxZoneLayers } from "@/hooks/useMapboxZoneLayers";
import { circlePolygon, ZONE_RADIUS_KM, normalizeReportCoordinates } from "@/lib/geo";
import { syncReportMarkersLayer, bringReportMarkersToFront } from "@/lib/mapbox-reports";
import { getZoneColorMap } from "@/lib/mapbox-zones";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/mapa")({
  component: MapaPage,
});

function MapaPage() {
  const { filters, setFilters } = useFilters();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pickOnMainMap, setPickOnMainMap] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<MapLocation | null>(null);
  const [demarcateActive, setDemarcateActive] = useState(false);
  const [saveZoneOpen, setSaveZoneOpen] = useState(false);
  const [pendingRing, setPendingRing] = useState<number[][] | null>(null);
  /** Zonas por nombre con área de 2 km visible (un círculo por zona) */
  const [activeRadiusZones, setActiveRadiusZones] = useState<Set<string>>(new Set());
  /** Zonas guardadas en BD con su área visible */
  const [visibleDemarcatedIds, setVisibleDemarcatedIds] = useState<Set<number>>(new Set());

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const draftMarkerRef = useRef<any>(null);
  const pickOnMainMapRef = useRef(pickOnMainMap);
  const demarcateActiveRef = useRef(demarcateActive);

  pickOnMainMapRef.current = pickOnMainMap;
  demarcateActiveRef.current = demarcateActive;

  const { reports = [], isLoading, verifyReport, isVerifying, refetch } = useReports(filters);
  const { reports: allReports = [] } = useReports({});
  const { zones, createZone, deleteZone, isDeleting, refetch: refetchZones } = useZones();

  useMapboxZoneLayers(mapRef, zones, visibleDemarcatedIds, activeRadiusZones, allReports);

  const toggleRadiusZone = (zoneName: string, enabled: boolean) => {
    setActiveRadiusZones((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(zoneName);
      else next.delete(zoneName);
      return next;
    });
  };

  const toggleDemarcatedZone = (zoneId: number, enabled: boolean) => {
    setVisibleDemarcatedIds((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(zoneId);
      else next.delete(zoneId);
      return next;
    });
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer?.("zone-radius-fill")) return;

    const onZoneClick = (e: { features?: { properties?: { id?: number; name?: string } }[] }) => {
      const id = e.features?.[0]?.properties?.id;
      const name = e.features?.[0]?.properties?.name;
      if (id != null) {
        setFilters((prev) => ({
          ...prev,
          zoneId: String(id),
          zone: "Todas",
        }));
        toast.info(`Filtro: zona demarcada «${name}»`);
      }
    };
    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", "zone-radius-fill", onZoneClick);
    map.on("mouseenter", "zone-radius-fill", onEnter);
    map.on("mouseleave", "zone-radius-fill", onLeave);

    return () => {
      map.off("click", "zone-radius-fill", onZoneClick);
      map.off("mouseenter", "zone-radius-fill", onEnter);
      map.off("mouseleave", "zone-radius-fill", onLeave);
    };
  }, [zones, setFilters]);

  // Hex color codes for the categories
  const getCategoryColorHex = (type?: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("robo") || t.includes("hurto") || t.includes("asalto")) return "#f43f5e"; // rose-500
    if (t.includes("incendio") || t.includes("fuego")) return "#f97316"; // orange-500
    if (t.includes("accidente") || t.includes("choque")) return "#f59e0b"; // amber-500
    return "#3b82f6"; // primary blue
  };

  // SSR-safe Mapbox GL initialization
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let mapInstance: any;
    let detachResize: (() => void) | null = null;

    const initMap = async () => {
      try {
        const mapboxgl = await loadMapboxGl();

        mapInstance = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: MAPBOX_STYLE,
          center: [SANTA_CRUZ_CENTER.lng, SANTA_CRUZ_CENTER.lat],
          zoom: 12.5,
          pitch: 55, // 3D tilt
          bearing: -15,
          antialias: true
        });

        mapRef.current = mapInstance;

        if (mapContainerRef.current) {
          detachResize = attachMapResizeObserver(mapInstance, mapContainerRef.current);
        }

        mapInstance.on("style.load", () => {
          const layers = mapInstance.getStyle().layers;
          const labelLayerId = layers.find(
            (layer: any) => layer.type === "symbol" && layer.layout && layer.layout["text-field"]
          )?.id;

          mapInstance.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 14,
              paint: {
                "fill-extrusion-color": "#4b5563",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "height"]
                ],
                "fill-extrusion-base": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "min_height"]
                ],
                "fill-extrusion-opacity": 0.55
              }
            },
            labelLayerId
          );
        });

        mapInstance.on("load", () => {
          burstMapResize(mapInstance);
          updateMarkers(mapboxgl);
        });

        mapInstance.on("error", (e: { error?: Error }) => {
          console.error("Mapbox:", e.error?.message ?? e);
          toast.error(
            "No se pudo cargar el mapa. Revisa VITE_MAPBOX_TOKEN en .env (token pk.* válido de mapbox.com)",
          );
        });

        mapInstance.on("click", (e: any) => {
          if (demarcateActiveRef.current) {
            const { lng, lat } = e.lngLat;
            setPendingRing(circlePolygon(lng, lat, ZONE_RADIUS_KM));
            setSaveZoneOpen(true);
            setDemarcateActive(false);
            toast.success(`Área de ${ZONE_RADIUS_KM} km definida. Asigna un nombre.`);
            return;
          }
          if (!pickOnMainMapRef.current) return;
          const { lng, lat } = e.lngLat;
          const loc = { latitude: lat, longitude: lng };
          setPendingLocation(loc);
          setPickOnMainMap(false);
          setCreateOpen(true);

          if (draftMarkerRef.current) {
            draftMarkerRef.current.setLngLat([lng, lat]);
          } else {
            const el = document.createElement("div");
            el.innerHTML = `
              <div class="size-4 rounded-full bg-primary border-2 border-white shadow-lg animate-pulse"></div>
            `;
            draftMarkerRef.current = new mapboxgl.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(mapInstance);
          }
        });
      } catch (err) {
        console.error("Error initializing Mapbox", err);
      }
    };

    initMap();

    return () => {
      detachResize?.();
      if (mapInstance) {
        mapInstance.remove();
      }
      mapRef.current = null;
    };
  }, []);

  // Update Mapbox Markers dynamically when reports list changes
  const updateMarkers = async (mapboxglInstance?: any) => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const mapboxgl = mapboxglInstance || (await import("mapbox-gl")).default;

      // Remove existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const reportsToShow = allReports.length > 0 ? allReports : reports;

      reportsToShow.forEach((report) => {
        const pos = normalizeReportCoordinates(report.coordinates);
        if (!pos) return;
        const [lng, lat] = pos;

        // Custom Google Maps-style Marker Element
        const el = document.createElement("button");
        el.className = "marker-btn group cursor-pointer relative";
        el.style.width = "auto";
        el.style.height = "auto";
        el.style.border = "none";
        el.style.backgroundColor = "transparent";

        const categoryColor = getCategoryColorHex(report.type?.name);
        
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <svg class="w-8 h-8 transition-transform group-hover:scale-110 drop-shadow-lg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 13.5 12 21 12 21C12 21 19 13.5 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="${categoryColor}" stroke="#ffffff" stroke-width="1.2"/>
            </svg>
            ${!report.verified ? `<span class="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 border border-background animate-pulse"></span>` : ""}
          </div>
        `;

        el.addEventListener("click", (ev) => {
          if (pickOnMainMapRef.current) {
            ev.stopPropagation();
            return;
          }
          setSelectedReportId(report.id);
          map.flyTo({
            center: [lng, lat],
            zoom: 15.5,
            pitch: 50,
            speed: 1.2
          });
        });

        // Add to map anchored at the bottom (tip of the pin)
        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([lng, lat])
          .addTo(map);

        markersRef.current.push(marker);
      });

      syncReportMarkersLayer(map, reportsToShow);
      bringReportMarkersToFront(map);
    } catch (e) {
      console.error("Error drawing markers", e);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layerIds = ["report-markers-circles", "report-markers-pin"];

    const onReportClick = (e: { features?: { properties?: { id?: number } }[] }) => {
      const id = e.features?.[0]?.properties?.id;
      if (id != null) {
        setSelectedReportId(Number(id));
        const feature = e.features?.[0];
        const geom = feature?.geometry as { coordinates?: number[] } | undefined;
        if (geom?.coordinates && mapRef.current) {
          mapRef.current.flyTo({
            center: geom.coordinates as [number, number],
            zoom: 15.5,
            pitch: 50,
            speed: 1.2,
          });
        }
      }
    };

    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const bindLayerEvents = () => {
      for (const layerId of layerIds) {
        if (!map.getLayer(layerId)) continue;
        map.on("click", layerId, onReportClick);
        map.on("mouseenter", layerId, onEnter);
        map.on("mouseleave", layerId, onLeave);
      }
    };

    const unbindLayerEvents = () => {
      for (const layerId of layerIds) {
        map.off("click", layerId, onReportClick);
        map.off("mouseenter", layerId, onEnter);
        map.off("mouseleave", layerId, onLeave);
      }
    };

    const setup = () => {
      unbindLayerEvents();
      bindLayerEvents();
    };

    if (map.loaded?.()) {
      setup();
    } else {
      map.once("load", setup);
    }

    return () => {
      map.off("load", setup);
      unbindLayerEvents();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded?.()) return;
    bringReportMarkersToFront(map);
  }, [activeRadiusZones, visibleDemarcatedIds, zones]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapRef.current.loaded?.()) {
      updateMarkers();
      return;
    }
    const map = mapRef.current;
    const onLoad = () => updateMarkers();
    map.once("load", onLoad);
    return () => {
      map.off("load", onLoad);
    };
  }, [reports, allReports]);

  // Verify report handler calling service/hook layer
  const handleVerify = async (id: number) => {
    try {
      await verifyReport(id);
      toast.success(`Incidente #${id} verificado con éxito.`);
    } catch (err: any) {
      toast.error(err.message || "Error al verificar el reporte");
    }
  };

  // Zoom/Tilt Button Handlers
  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleToggle3D = () => {
    if (!mapRef.current) return;
    const currentPitch = mapRef.current.getPitch();
    mapRef.current.easeTo({
      pitch: currentPitch > 10 ? 0 : 55,
      bearing: currentPitch > 10 ? 0 : -15,
      duration: 1000
    });
  };

  const zoneColorMap = getZoneColorMap(allReports);
  const zonesMap: Record<string, { alerts: number; verified: number; colorHex: string }> = {};

  allReports.forEach((r) => {
    const zoneName = r.zone?.trim() || "Zona desconocida";
    if (!zonesMap[zoneName]) {
      zonesMap[zoneName] = {
        alerts: 0,
        verified: 0,
        colorHex: zoneColorMap[zoneName] ?? "#3b82f6",
      };
    }
    zonesMap[zoneName].alerts += 1;
    if (r.verified) zonesMap[zoneName].verified += 1;
  });

  const activeZones = Object.entries(zonesMap).map(([name, data]) => ({
    name,
    ...data,
  }));

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Operaciones · Tiempo real
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Mapa de incidentes 3D
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Visualiza reportes activos mapeados proporcionalmente sobre Santa Cruz de la Sierra. 
            Filtra en la barra lateral para acotar baches, accidentes, o robos en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setPendingLocation(null);
              setCreateOpen(true);
            }}
            className="rounded-xl gap-2 font-bold cursor-pointer"
          >
            <PlusCircle className="size-4" />
            Nueva alerta
          </Button>
          <Button
            variant={pickOnMainMap ? "default" : "secondary"}
            onClick={() => {
              setPickOnMainMap((v) => !v);
              if (!pickOnMainMap) {
                setDemarcateActive(false);
                toast.info("Haz clic en el mapa principal para fijar la ubicación");
              }
            }}
            className="rounded-xl gap-2 border border-border cursor-pointer"
          >
            <Crosshair className="size-4" />
            {pickOnMainMap ? "Cancelar selección" : "Elegir en este mapa"}
          </Button>
          <Button
            variant={demarcateActive ? "default" : "secondary"}
            onClick={() => {
              setDemarcateActive((v) => !v);
              if (!demarcateActive) {
                setPickOnMainMap(false);
                toast.info(
                  `Clic en el mapa: se crea un área de ${ZONE_RADIUS_KM} km alrededor del punto`,
                );
              }
            }}
            className="rounded-xl gap-2 border border-border cursor-pointer"
          >
            <Circle className="size-4" />
            {demarcateActive ? "Cancelar demarcación" : "Demarcar zona (2 km)"}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              setFilters((prev) => ({ ...prev, zone: "Todas", zoneId: "" }))
            }
            className="rounded-xl gap-2 border border-border cursor-pointer"
          >
            <Layers className="size-4" />
            Todas las zonas
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6 min-w-0">
        {/* Sidebar de Zonas */}
        <aside className="bg-card border border-border rounded-2xl p-5 self-start max-h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-sm">Zonas demarcadas</h3>
            <span className="text-xs text-muted-foreground">{zones.length}</span>
          </div>

          {zones.length === 0 ? (
            <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
              «Demarcar zona (2 km)»: clic en el mapa para definir el centro de una zona de{" "}
              {ZONE_RADIUS_KM} km.
            </p>
          ) : (
            <ul className="space-y-1 mb-4">
              {zones.map((z) => (
                <li key={z.id} className="flex items-center gap-2 p-2 rounded-xl border border-border/60">
                  <Switch
                    checked={visibleDemarcatedIds.has(z.id)}
                    onCheckedChange={(on) => toggleDemarcatedZone(z.id, on)}
                    aria-label={`Mostrar área de zona ${z.name}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        zoneId: String(z.id),
                        zone: "Todas",
                      }))
                    }
                    className={`flex-1 text-left min-w-0 transition-colors cursor-pointer ${
                      filters.zoneId === String(z.id) ? "text-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: z.color }}
                      />
                      <span className="text-sm font-medium truncate">{z.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Radio {ZONE_RADIUS_KM} km</span>
                  </button>
                  <button
                    type="button"
                    title="Eliminar zona"
                    disabled={isDeleting}
                    onClick={async () => {
                      try {
                        await deleteZone(z.id);
                        if (filters.zoneId === String(z.id)) {
                          setFilters((prev) => ({ ...prev, zoneId: "" }));
                        }
                        toast.success(`Zona «${z.name}» eliminada`);
                        refetchZones();
                      } catch (err: unknown) {
                        toast.error(
                          err instanceof Error ? err.message : "No se pudo eliminar",
                        );
                      }
                    }}
                    className="size-8 shrink-0 rounded-lg border border-border hover:border-destructive hover:text-destructive grid place-items-center cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between mb-2 pt-3 border-t border-border">
            <h3 className="font-display font-bold text-sm">Por nombre en reportes</h3>
            <span className="text-xs text-muted-foreground">{activeZones.length}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
            Activa el interruptor para ver el área de la zona ({ZONE_RADIUS_KM} km desde su centro,
            según las alertas agrupadas). Los pines siguen siendo cada incidente.
          </p>
          
          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, zone: "Todas", zoneId: "" }))
            }
            className={`w-full text-left p-3 rounded-xl border mb-2 transition-colors cursor-pointer ${
              filters.zone === "Todas" && !filters.zoneId
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-transparent hover:bg-muted"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Todas las zonas</span>
              <span className="text-xs">{reports.length}</span>
            </div>
          </button>

          {activeZones.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Sin incidentes registrados
            </div>
          ) : (
            <ul className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
              {activeZones.map((z) => (
                <li
                  key={z.name}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors ${
                    filters.zone === z.name && !filters.zoneId
                      ? "bg-primary/10 border-primary/30"
                      : "border-transparent hover:bg-muted"
                  }`}
                >
                  <Switch
                    checked={activeRadiusZones.has(z.name)}
                    onCheckedChange={(on) => toggleRadiusZone(z.name, on)}
                    aria-label={`Mostrar área de zona ${z.name}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        zone: z.name,
                        zoneId: "",
                      }))
                    }
                    className="flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: z.colorHex }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{z.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {z.alerts} alertas · {z.verified} verif.
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="min-w-0">
        {/* Mapa Real Mapbox 3D */}
        <div
          className={`relative w-full h-[min(72vh,720px)] min-h-[520px] bg-card border rounded-2xl overflow-hidden transition-colors ${
            pickOnMainMap || demarcateActive
              ? "border-primary ring-2 ring-primary/30"
              : "border-border"
          }`}
        >
          <div
            ref={mapContainerRef}
            className={`absolute inset-0 w-full h-full min-w-0 ${
              pickOnMainMap || demarcateActive ? "cursor-crosshair" : ""
            }`}
          />

          {isLoading && (
            <div className="absolute inset-0 grid place-items-center bg-background/50 backdrop-blur-sm z-10">
              <span className="text-xs text-muted-foreground">Cargando incidentes...</span>
            </div>
          )}

          {/* Detail card floating */}
          {selectedReport && (
            <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 bg-card/95 backdrop-blur border border-border p-5 rounded-xl shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedReport.verified
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {selectedReport.verified ? "Verificado" : "Pendiente"}
                </span>
                <button
                  onClick={() => setSelectedReportId(null)}
                  className="size-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {selectedReport.images?.[0]?.url && (
                <div className="relative h-32 rounded-lg overflow-hidden border border-border mb-3">
                  <img
                    src={selectedReport.images[0].url}
                    alt={selectedReport.type?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h4 className="font-display font-bold text-base mb-1.5">
                {selectedReport.type?.name || "Incidente Reportado"}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {selectedReport.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground border-t border-border pt-3 mb-4 font-mono">
                <div>ZONA: {selectedReport.zone}</div>
                <div>ID: #{selectedReport.id}</div>
                <div>PESO: {selectedReport.weight} pts</div>
                <div>FECHA: {new Date(selectedReport.created_at).toLocaleDateString()}</div>
              </div>

              {!selectedReport.verified && (
                <Button
                  onClick={() => handleVerify(selectedReport.id)}
                  disabled={isVerifying}
                  size="sm"
                  className="w-full rounded-lg font-bold gap-2 cursor-pointer"
                >
                  <Check className="size-3.5" />
                  {isVerifying ? "Verificando..." : "Confirmar Veracidad"}
                </Button>
              )}
            </div>
          )}

          {/* Overlay top info */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-border text-[10px] font-bold uppercase tracking-widest">
              <Radio className="size-3 text-primary animate-pulse" />
              Vista activa · {reports.length} reportes
            </div>
            {pickOnMainMap && (
              <div className="px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                Clic en el mapa para ubicar la alerta
              </div>
            )}
            {demarcateActive && (
              <div className="px-3 py-1.5 rounded-full bg-violet-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
                Clic en el mapa · área de {ZONE_RADIUS_KM} km
              </div>
            )}
            {activeRadiusZones.size > 0 && (
              <div className="px-3 py-1.5 rounded-full bg-sky-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
                {activeRadiusZones.size + visibleDemarcatedIds.size} zona(s) visibles · {ZONE_RADIUS_KM} km
              </div>
            )}
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
            <button
              onClick={handleZoomIn}
              title="Acercar"
              className="size-9 rounded-lg bg-background/80 backdrop-blur border border-border grid place-items-center hover:bg-card transition-colors cursor-pointer"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Alejar"
              className="size-9 rounded-lg bg-background/80 backdrop-blur border border-border grid place-items-center hover:bg-card transition-colors cursor-pointer"
            >
              <Minus className="size-4" />
            </button>
            <button
              onClick={handleToggle3D}
              title="Alternar Vista 3D / 2D"
              className="size-9 rounded-lg bg-background/80 backdrop-blur border border-border grid place-items-center hover:bg-card transition-colors cursor-pointer"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] text-muted-foreground z-10 pointer-events-none">
            <MapPin className="size-3" />
            Santa Cruz de la Sierra · Bolivia
          </div>
        </div>
        </div>
      </div>

      <SaveZoneDialog
        open={saveZoneOpen}
        onOpenChange={setSaveZoneOpen}
        coordinates={pendingRing}
        onSave={async (name, color, coordinates) => {
          await createZone({ name, color, coordinates });
          toast.success(`Zona «${name}» guardada`);
          setPendingRing(null);
          refetchZones();
        }}
      />

      <CreateAlertSheet
        open={createOpen}
        demarcatedZones={zones}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setPendingLocation(null);
            draftMarkerRef.current?.remove();
            draftMarkerRef.current = null;
          }
        }}
        initialLocation={pendingLocation}
        onCreated={() => {
          refetch();
          draftMarkerRef.current?.remove();
          draftMarkerRef.current = null;
          setPendingLocation(null);
        }}
      />
    </div>
  );
}