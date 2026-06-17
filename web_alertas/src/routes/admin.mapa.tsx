import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import { type ColumnDef } from "@tanstack/react-table";

import { useReports } from "@/hooks/useReports";
import { CreateAlertSheet } from "@/components/admin/CreateAlertSheet";
import { SaveZoneDialog } from "@/components/admin/SaveZoneDialog";
import { FilterButton } from "@/components/admin/FilterButton";
import { ReportsFilterSheet } from "@/components/admin/ReportsFilterSheet";
import { useFilters } from "@/context/FilterContext";
import type { MapLocation } from "@/components/admin/LocationPickerMap";
import {
  loadMapboxGl,
  MAPBOX_MAP_OPTIONS,
  MAPBOX_STYLE,
  SANTA_CRUZ_CENTER,
  attachMapResizeObserver,
  burstMapResize,
} from "@/lib/mapbox";
import { useMapboxRiskZones, type RiskZone } from "@/hooks/useMapboxRiskZones";
import { RiskZonesPanel } from "@/components/admin/RiskZonesPanel";
import { LiveTrackingPanel } from "@/components/admin/LiveTrackingPanel";
import { EmergencyStationsPanel } from "@/components/admin/EmergencyStationsPanel";
import { VerifyEvidenceDialog } from "@/components/admin/VerifyEvidenceDialog";
import { useLiveTrackings } from "@/hooks/useLiveTrackings";
import { useSnappedTrackings } from "@/hooks/useSnappedTrackings";
import { useMapboxTrackings } from "@/hooks/useMapboxTrackings";
import { useEmergencyStations } from "@/hooks/useEmergencyStations";
import { useMapboxEmergencyStations } from "@/hooks/useMapboxEmergencyStations";
import type { LiveTracking } from "@/domain/tracking";
import type { EmergencyStation } from "@/domain/types";
import { getSession } from "@/api/httpClient";
import type { Report } from "@/domain/types";
import { normalizeReportCoordinates } from "@/lib/geo";
import { syncReportMarkersLayer, bringReportMarkersToFront } from "@/lib/mapbox-reports";
import { filterReportsForMap } from "@/lib/report-visibility";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/mapa")({
  component: MapaPage,
});

function MapaPage() {

  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pickOnMainMap, setPickOnMainMap] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<MapLocation | null>(null);
  /** Capa de índice de riesgo (círculos verde → rojo) */
  const [showRiskZones, setShowRiskZones] = useState(true);
  /** Unidades de autoridad en ruta (Firebase RTDB) */
  const [showLiveTracking, setShowLiveTracking] = useState(true);
  /** Instalaciones de emergencia (policía, bomberos, etc.) */
  const [showEmergencyStations, setShowEmergencyStations] = useState(true);
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);
  const trackingMarkersRef = useRef<Map<string, any>>(new Map());
  const [verifyTarget, setVerifyTarget] = useState<Report | null>(null);

  const [isDeletingReport, setIsDeletingReport] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const draftMarkerRef = useRef<any>(null);
  const pickOnMainMapRef = useRef(pickOnMainMap);
  pickOnMainMapRef.current = pickOnMainMap;

  const { filters, activeCount } = useFilters();
  const { reports = [], isLoading, verifyReport, isVerifying, deleteReport, refetch } = useReports({
    ...filters,
    includeDeleted: true,
  });
  const mapReports = useMemo(() => filterReportsForMap(reports), [reports]);
  const { emergencyStations } = useEmergencyStations();

  const { riskZones } = useMapboxRiskZones(mapRef, mapReports, showRiskZones);
  useMapboxEmergencyStations(mapRef, emergencyStations, showEmergencyStations);

  const { trackings, error: trackingError, connected: trackingConnected } =
    useLiveTrackings(showLiveTracking);
  const displayTrackings = useSnappedTrackings(trackings, showLiveTracking);

  const handleSelectTracking = useCallback((id: string) => {
    setSelectedTrackingId((prev) => (prev === id ? null : id));
    setSelectedReportId(null);
  }, []);

  const handleFocusTracking = useCallback((tracking: LiveTracking) => {
    mapRef.current?.flyTo({
      center: [tracking.longitude, tracking.latitude],
      zoom: 15.5,
      pitch: 50,
      speed: 1.2,
    });
  }, []);

  useMapboxTrackings(
    mapRef,
    displayTrackings,
    showLiveTracking,
    trackingMarkersRef,
    selectedTrackingId,
    handleSelectTracking,
  );

  useEffect(() => {
    if (trackingError) {
      toast.error(`Tracking en vivo: ${trackingError}`);
    }
  }, [trackingError]);

  const handleFocusRiskZone = (zone: RiskZone) => {
    mapRef.current?.flyTo({
      center: [zone.lng, zone.lat],
      zoom: 13.8,
      pitch: 50,
      speed: 1.2,
    });
  };

  const handleFocusStation = useCallback((station: EmergencyStation) => {
    mapRef.current?.flyTo({
      center: station.coordinates as [number, number],
      zoom: 15.5,
      pitch: 50,
      speed: 1.2,
    });
  }, []);





  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer?.("risk-zones-fill")) return;

    const onRiskClick = (e: {
      features?: { properties?: { name?: string; riskIndex?: number; reportCount?: number } }[];
    }) => {
      const props = e.features?.[0]?.properties;
      if (!props?.name) return;
      const pct = Math.round((props.riskIndex ?? 0) * 100);
      toast.info(`Zona «${props.name}» · índice ${pct}% · ${props.reportCount ?? 0} incidentes`);
    };
    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", "risk-zones-fill", onRiskClick);
    map.on("mouseenter", "risk-zones-fill", onEnter);
    map.on("mouseleave", "risk-zones-fill", onLeave);

    return () => {
      map.off("click", "risk-zones-fill", onRiskClick);
      map.off("mouseenter", "risk-zones-fill", onEnter);
      map.off("mouseleave", "risk-zones-fill", onLeave);
    };
  }, [showRiskZones, riskZones.length]);

  useEffect(() => {
    if (!mapRef.current?.loaded?.()) return;
    void updateMarkers();
  }, [showRiskZones, riskZones.length]);

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
          antialias: true,
          ...MAPBOX_MAP_OPTIONS,
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

      mapReports.forEach((report) => {
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
            <svg class="w-10 h-10 transition-transform group-hover:scale-110 drop-shadow-lg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 13.5 12 21 12 21C12 21 19 13.5 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="${categoryColor}" stroke="#ffffff" stroke-width="1.4"/>
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
          setSelectedTrackingId(null);
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

      syncReportMarkersLayer(map, mapReports);
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
        setSelectedTrackingId(null);
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
  }, []);

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
  }, [mapReports]);

  // Verify report handler calling service/hook layer
  const handleVerify = (report: Report) => {
    setVerifyTarget(report);
  };

  const handleConfirmVerify = async () => {
    if (!verifyTarget) return;
    try {
      await verifyReport(verifyTarget.id);
      toast.success(`Incidente #${verifyTarget.id} verificado con éxito.`);
      setVerifyTarget(null);
      setSelectedReportId(null);
    } catch (err: any) {
      toast.error(err.message || "Error al verificar el reporte");
    }
  };

  const isAdmin = getSession()?.user?.role?.name?.toLowerCase() === "admin";

  const handleDeleteReport = async (id: number) => {
    setIsDeletingReport(true);
    try {
      await deleteReport(id);
      toast.success("Incidente eliminado correctamente.");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar reporte");
    } finally {
      setIsDeletingReport(false);
    }
  };

  const handleRefresh = async () => {
    await refetch();
    await updateMarkers();
    toast.success("Mapa y datos actualizados");
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

  const zoneColorMap = getZoneColorMap(reports);
  const zonesMap: Record<string, { alerts: number; verified: number; colorHex: string }> = {};

  reports.forEach((r) => {
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
  const selectedTracking = trackings.find((t) => t.id === selectedTrackingId);

  const totalCount = reports.length;
  const verifiedCount = reports.filter((r) => r.verified).length;
  const pendingCount = totalCount - verifiedCount;

  const cards = [
    { label: "Total", value: totalCount.toString() },
    { label: "Verificados", value: verifiedCount.toString() },
    { label: "Pendientes", value: pendingCount.toString() },
  ];

  const reportColumns: ColumnDef<(typeof reports)[0]>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">#{String(getValue())}</span>
      ),
    },
    {
      id: "type",
      header: "Tipo",
      accessorFn: (r) => r.type?.name ?? "",
      cell: ({ getValue }) => <span className="font-medium">{String(getValue()) || "Desconocido"}</span>,
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground max-w-[200px] truncate block">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "zone",
      header: "Zona",
      cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>,
    },
    {
      accessorKey: "verified",
      header: "Estado",
      cell: ({ getValue }) => (
        <StatusBadge status={getValue() ? "Verificado" : "Pendiente"} />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Fecha",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {new Date(String(getValue())).toLocaleString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          {!row.original.verified && (
            <button
              onClick={() => handleVerify(row.original)}
              disabled={isVerifying}
              title="Verificar"
              className="size-8 rounded-lg border border-border hover:border-emerald-500 hover:text-emerald-500 grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="size-3.5" />
            </button>
          )}
          <button
            onClick={() => handleDeleteReport(row.original.id)}
            disabled={isDeletingReport}
            title="Eliminar"
            className="size-8 rounded-lg border border-border hover:border-destructive hover:text-destructive grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

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
            Reportes georreferenciados sobre Santa Cruz. Las zonas de riesgo se calculan en
            círculos verde → rojo según la densidad de incidentes. Las autoridades en ruta se
            ven en tiempo real (línea azul + ícono móvil).
          </p>
        </div>
      </div>

      <div className="min-w-0 flex flex-col gap-4">
        <div className="grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-4 items-start">
          {/* Mapa Real Mapbox 3D */}
          <div
          className={`relative w-full h-[min(72vh,720px)] min-h-[520px] bg-card border rounded-2xl overflow-hidden transition-colors ${
            pickOnMainMap
              ? "border-primary ring-2 ring-primary/30"
              : "border-border"
          }`}
        >
          <div
            ref={mapContainerRef}
            className={`absolute inset-0 w-full h-full min-w-0 ${
              pickOnMainMap ? "cursor-crosshair" : ""
            }`}
          />

          {isLoading && (
            <div className="absolute inset-0 grid place-items-center bg-background/50 backdrop-blur-sm z-10">
              <span className="text-xs text-muted-foreground">Cargando incidentes...</span>
            </div>
          )}

          {/* Detail card floating */}
          {selectedTracking && (
            <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 bg-card/95 backdrop-blur border border-blue-500/30 p-5 rounded-xl shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start justify-between mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Unidad en ruta
                </span>
                <button
                  onClick={() => setSelectedTrackingId(null)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
              <h4 className="font-display font-bold text-base mb-1.5">
                {selectedTracking.type || "Autoridad en camino"}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {selectedTracking.description || "En ruta hacia el incidente"}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground border-t border-border pt-3 font-mono">
                <div>LAT: {selectedTracking.latitude.toFixed(5)}</div>
                <div>LNG: {selectedTracking.longitude.toFixed(5)}</div>
                <div className="col-span-2 truncate">UUID: {selectedTracking.id}</div>
                <div>RUTA: {selectedTracking.route.length} puntos</div>
              </div>
            </div>
          )}

          {selectedReport && !selectedTracking && (
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
                  onClick={() => handleVerify(selectedReport)}
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
              Vista activa · {mapReports.length} en mapa · {reports.length} total
            </div>
            {pickOnMainMap && (
              <div className="px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                Clic en el mapa para ubicar la alerta
              </div>
            )}

            {showEmergencyStations && emergencyStations.length > 0 && (
              <div className="px-3 py-1.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
                {emergencyStations.length} estación(es) de emergencia
              </div>
            )}
            {showLiveTracking && trackings.length > 0 && (
              <div className="px-3 py-1.5 rounded-full bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
                {trackings.length} unidad(es) en ruta · calles Mapbox
              </div>
            )}
            {showRiskZones && riskZones.length > 0 && (
              <div className="px-3 py-1.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
                {riskZones.length} zona(s) de riesgo · verde → rojo
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

          <div className="flex flex-col gap-4 min-w-0">
          <EmergencyStationsPanel
            stations={emergencyStations}
            enabled={showEmergencyStations}
            onEnabledChange={setShowEmergencyStations}
            onFocusStation={handleFocusStation}
          />
          <RiskZonesPanel
            zones={riskZones}
            enabled={showRiskZones}
            onEnabledChange={setShowRiskZones}
            onFocusZone={handleFocusRiskZone}
          />
          <LiveTrackingPanel
            trackings={trackings}
            enabled={showLiveTracking}
            onEnabledChange={setShowLiveTracking}
            connected={trackingConnected}
            error={trackingError}
            selectedId={selectedTrackingId}
            onSelect={setSelectedTrackingId}
            onFocus={handleFocusTracking}
          />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
          <FilterButton activeCount={activeCount} onClick={() => setFiltersOpen(true)} />
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
            onClick={handleRefresh}
            variant="secondary"
            className="rounded-xl gap-2 border border-border cursor-pointer"
          >
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {cards.map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-2xl p-6">
              <div className="font-display text-4xl font-bold text-primary mb-1 leading-none">
                {c.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                {c.label}
              </div>
            </div>
          ))}
        </div>

        <DataTable
          columns={reportColumns}
          data={reports}
          isLoading={isLoading}
          emptyMessage="Ningún reporte encontrado."
          footerText={`${reports.length} incidentes en vista`}
        />
      </div>

      <ReportsFilterSheet open={filtersOpen} onOpenChange={setFiltersOpen} />

      <VerifyEvidenceDialog
        report={verifyTarget}
        open={!!verifyTarget}
        onOpenChange={(open) => !open && setVerifyTarget(null)}
        onConfirm={handleConfirmVerify}
        isVerifying={isVerifying}
        isAdmin={isAdmin}
      />

      <CreateAlertSheet
        open={createOpen}
        riskZones={riskZones}
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

function StatusBadge({ status }: { status: "Verificado" | "Pendiente" }) {
  const verified = status === "Verificado";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
        verified
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
      }`}
    >
      <span className={`size-1.5 rounded-full ${verified ? "bg-emerald-400" : "bg-amber-400"}`} />
      {status}
    </span>
  );
}