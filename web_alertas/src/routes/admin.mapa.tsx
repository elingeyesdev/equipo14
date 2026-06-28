import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Radio,
  MapPin,
  Plus as ZoomIn,
  Minus,
  Maximize2,
  Check,
  X,
  PlusCircle,
  Trash2,
  RefreshCw,
  List,
  Shield,
  Clock,
  Flame,
  HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { useReports } from "@/hooks/useReports";
import { CreateAlertSheet } from "@/components/admin/CreateAlertSheet";
import { VerifyEvidenceDialog } from "@/components/admin/VerifyEvidenceDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { ImageCarouselDialog } from "@/components/admin/ImageCarouselDialog";
import type { MapLocation } from "@/components/admin/LocationPickerMap";
import {
  loadMapboxGl,
  MAPBOX_MAP_OPTIONS,
  MAPBOX_STYLE,
  SANTA_CRUZ_CENTER,
  attachMapResizeObserver,
  burstMapResize,
} from "@/lib/mapbox";
import { useMapboxRiskZones } from "@/hooks/useMapboxRiskZones";
import { useEmergencyStations } from "@/hooks/useEmergencyStations";
import { useMapboxEmergencyStations } from "@/hooks/useMapboxEmergencyStations";
import { useLiveTrackings } from "@/hooks/useLiveTrackings";
import { useSnappedTrackings } from "@/hooks/useSnappedTrackings";
import { useMapboxTrackings } from "@/hooks/useMapboxTrackings";
import { getSession } from "@/api/httpClient";
import type { Report, ReportImage } from "@/domain/types";
import { normalizeReportCoordinates } from "@/lib/geo";
import { syncReportMarkersLayer, bringReportMarkersToFront } from "@/lib/mapbox-reports";
import { toast } from "sonner";
import { reportsSocketService } from "@/services/reportsSocket.service";

export const Route = createFileRoute("/admin/mapa")({
  component: MapaPage,
});

const getCategoryMarkerConfig = (typeName?: string) => {
  const name = typeName?.toLowerCase() || "";
  if (name.includes("robo") || name.includes("hurto") || name.includes("asalto")) {
    return {
      color: "#B64D4C",
      iconPaths: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`
    };
  }
  if (name.includes("incendio") || name.includes("fuego")) {
    return {
      color: "#AA5F3C",
      iconPaths: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`
    };
  }
  if (name.includes("accidente") || name.includes("vial") || name.includes("choque")) {
    return {
      color: "#506E96",
      iconPaths: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`
    };
  }
  if (name.includes("médica") || name.includes("salud") || name.includes("enfermo")) {
    return {
      color: "#3C8C6E",
      iconPaths: `<path d="M19 10h-5V5c0-.6-.4-1-1-1h-2c-.6 0-1 .4-1 1v5H5c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h5v5c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-5h5c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1z"/>`
    };
  }
  if (name.includes("violencia") || name.includes("familiar")) {
    return {
      color: "#8B5CF6",
      iconPaths: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`
    };
  }
  if (name.includes("disturbio")) {
    return {
      color: "#D97706",
      iconPaths: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9.5" y1="9.5" x2="14.5" y2="14.5"/><line x1="14.5" y1="9.5" x2="9.5" y2="14.5"/>`
    };
  }
  return {
    color: "#AF6D58",
    iconPaths: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`
  };
};
const getReportCategory = (typeName?: string): "policia" | "bombero" | "medico" | "other" => {
  const name = typeName?.toLowerCase() || "";
  if (name.includes("incendio") || name.includes("fuego")) {
    return "bombero";
  }
  if (name.includes("médica") || name.includes("salud") || name.includes("enfermo")) {
    return "medico";
  }
  if (
    name.includes("robo") ||
    name.includes("hurto") ||
    name.includes("asalto") ||
    name.includes("violencia") ||
    name.includes("familiar") ||
    name.includes("disturbio") ||
    name.includes("pelea") ||
    name.includes("accidente") ||
    name.includes("vial") ||
    name.includes("choque")
  ) {
    return "policia";
  }
  return "other";
};

function MapaPage() {
  const queryClient = useQueryClient();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pickOnMainMap, setPickOnMainMap] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<MapLocation | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<Report | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselImages, setCarouselImages] = useState<ReportImage[]>([]);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState(0);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [alertsListOpen, setAlertsListOpen] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [stationFilter, setStationFilter] = useState<"todos" | "policia" | "bombero" | "medico">("todos");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const draftMarkerRef = useRef<any>(null);
  const trackingMarkersRef = useRef<Map<string, any>>(new Map());
  const pickOnMainMapRef = useRef(pickOnMainMap);
  pickOnMainMapRef.current = pickOnMainMap;

  // Real-time report handler via WebSockets
  useEffect(() => {
    const unsubscribe = reportsSocketService.subscribe((newReport) => {
      const cache = queryClient.getQueryCache();
      const queries = cache.findAll({ queryKey: ["reports"] });
      
      queries.forEach((query) => {
        const queryKey = query.queryKey;
        queryClient.setQueryData<Report[]>(queryKey, (oldReports = []) => {
          if (oldReports.some((r) => r.id === newReport.id)) {
            return oldReports;
          }
          return [newReport, ...oldReports];
        });
      });
      
      toast.info(`Nuevo incidente reportado: ${newReport.type?.name || "Alerta"}`);
    });

    return () => unsubscribe();
  }, [queryClient]);

  const { reports = [], isLoading, verifyReport, isVerifying, deleteReport, refetch } = useReports({
    includeDeleted: true,
  });

  const mapReports = useMemo(
    () => reports.filter((r) => r.coordinates && r.coordinates.length >= 2),
    [reports],
  );

  const { emergencyStations = [], refetch: refetchStations } = useEmergencyStations();
 
  const filteredStations = useMemo(() => {
    if (stationFilter === "todos") return emergencyStations;
    const targetType = stationFilter === "medico" ? "hospital" : stationFilter;
    return emergencyStations.filter(
      (s) => s.installation_type?.toLowerCase() === targetType,
    );
  }, [emergencyStations, stationFilter]);

  const filteredReports = useMemo(() => {
    if (stationFilter === "todos") return mapReports;
    return mapReports.filter((report) => {
      const category = getReportCategory(report.type?.name);
      return category === stationFilter;
    });
  }, [mapReports, stationFilter]);
 
  // Force fresh data load on screen entry
  useEffect(() => {
    refetch();
    refetchStations();
  }, [refetch, refetchStations]);

  // All layers always active as requested
  useMapboxRiskZones(map, filteredReports, true, isMapReady);
  useMapboxEmergencyStations(map, filteredStations, true, isMapReady);

  const { trackings = [] } = useLiveTrackings(true);
  const displayTrackings = useSnappedTrackings(trackings, true);

  const filteredTrackings = useMemo(() => {
    if (stationFilter === "todos") return displayTrackings;
    const targetType = stationFilter === "medico" ? "paramedico" : stationFilter;
    return displayTrackings.filter(
      (t) => t.profileType?.toLowerCase() === targetType || t.type?.toLowerCase() === targetType,
    );
  }, [displayTrackings, stationFilter]);

  const handleSelectTracking = useCallback((id: string) => {
    setSelectedTrackingId((prev) => (prev === id ? null : id));
    setSelectedReportId(null);
  }, []);

  useMapboxTrackings(
    map,
    filteredTrackings,
    true,
    trackingMarkersRef,
    selectedTrackingId,
    handleSelectTracking,
    isMapReady,
  );

  // SSR-safe Mapbox GL initialization
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let mapInstance: any;
    let detachResize: (() => void) | null = null;
    let isCancelled = false;

    const initMap = async () => {
      try {
        const mapboxgl = await loadMapboxGl();
        if (isCancelled) return;

        mapInstance = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: MAPBOX_STYLE,
          center: [SANTA_CRUZ_CENTER.lng, SANTA_CRUZ_CENTER.lat],
          zoom: 12.5,
          pitch: 55,
          bearing: -15,
          antialias: true,
          ...MAPBOX_MAP_OPTIONS,
        });

        if (isCancelled) {
          mapInstance.remove();
          return;
        }

        mapRef.current = mapInstance;
        setMap(mapInstance);

        if (mapContainerRef.current) {
          detachResize = attachMapResizeObserver(mapInstance, mapContainerRef.current);
        }

        mapInstance.on("style.load", () => {
          if (isCancelled) return;
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
          if (isCancelled) return;
          burstMapResize(mapInstance);
          setIsMapReady(true);
        });

        mapInstance.on("error", (e: { error?: Error }) => {
          if (isCancelled) return;
          console.error("Mapbox:", e.error?.message ?? e);
          toast.error(
            "No se pudo cargar el mapa. Revisa VITE_MAPBOX_TOKEN en .env"
          );
        });

        mapInstance.on("click", (e: any) => {
          if (isCancelled) return;
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
              <div class="size-4 bg-primary border-2 border-white shadow-lg animate-pulse rounded-none"></div>
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
      isCancelled = true;
      detachResize?.();
      if (mapInstance) {
        mapInstance.remove();
      }
      mapRef.current = null;
      setMap(null);
      setIsMapReady(false);
    };
  }, []);

  // Update Report Markers dynamically
  useEffect(() => {
    if (!map || !isMapReady) return;

    let active = true;

    const drawMarkers = async () => {
      try {
        const mapboxgl = await loadMapboxGl();
        if (!active) return;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        filteredReports.forEach((report) => {
          const pos = normalizeReportCoordinates(report.coordinates);
          if (!pos) return;
          const [lng, lat] = pos;

          const el = document.createElement("button");
          el.className = "marker-btn group cursor-pointer relative";
          el.style.width = "auto";
          el.style.height = "auto";
          el.style.border = "none";
          el.style.backgroundColor = "transparent";

          const config = getCategoryMarkerConfig(report.type?.name);

          el.innerHTML = `
            <div class="relative flex flex-col items-center">
              <svg class="w-10 h-11 transition-transform group-hover:scale-110 drop-shadow-lg" viewBox="0 0 38 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 44C29 34 38 27.5 38 19C38 8.5 29.5 0 19 0C8.5 0 0 8.5 0 19C0 27.5 9 34 19 44Z" fill="#ffffff"/>
                <circle cx="19" cy="19" r="14" fill="${config.color}"/>
                <svg x="10" y="10" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  ${config.iconPaths}
                </svg>
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
              speed: 1.2,
            });
          });

          const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([lng, lat])
            .addTo(map);

          markersRef.current.push(marker);
        });

        syncReportMarkersLayer(map, filteredReports);
        bringReportMarkersToFront(map);
      } catch (e) {
        console.error("Error drawing markers", e);
      }
    };

    void drawMarkers();

    return () => {
      active = false;
    };
  }, [map, isMapReady, filteredReports]);

  // Clean up markers and draft markers when map instance changes
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      draftMarkerRef.current?.remove();
      draftMarkerRef.current = null;
    };
  }, [map]);

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
      setSelectedReportId(null);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar reporte");
    } finally {
      setIsDeletingReport(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchStations()]);
    toast.success("Mapa y datos actualizados");
  };

  const handleZoomIn = () => {
    map?.zoomIn();
  };

  const handleZoomOut = () => {
    map?.zoomOut();
  };

  const handleToggle3D = () => {
    if (!map) return;
    const currentPitch = map.getPitch();
    map.easeTo({
      pitch: currentPitch > 10 ? 0 : 55,
      bearing: currentPitch > 10 ? 0 : -15,
      duration: 1000
    });
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId);
  const selectedTracking = trackings.find((t) => t.id === selectedTrackingId);

  return (
    <div className="relative -mx-6 -my-8 lg:-mx-10 h-screen w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)] overflow-hidden bg-card border-none rounded-none">
      <div
        ref={mapContainerRef}
        className={`absolute inset-0 w-full h-full min-w-0 ${
          pickOnMainMap ? "cursor-crosshair" : ""
        }`}
      />
 
      {/* Floating Chips for Emergency Stations Filter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-background/90 backdrop-blur border border-border/40 p-1.5 rounded-none shadow-md max-w-[calc(100%-24rem)] overflow-x-auto no-scrollbar pointer-events-auto">
        <button
          onClick={() => setStationFilter("todos")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            stationFilter === "todos"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted"
          }`}
        >
          <Radio className="size-3" />
          Todos
        </button>
        <button
          onClick={() => setStationFilter("policia")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            stationFilter === "policia"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-transparent text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted"
          }`}
        >
          <Shield className="size-3" />
          Policía
        </button>
        <button
          onClick={() => setStationFilter("bombero")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            stationFilter === "bombero"
              ? "bg-orange-600 text-white border-orange-600"
              : "bg-transparent text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted"
          }`}
        >
          <Flame className="size-3" />
          Bomberos
        </button>
        <button
          onClick={() => setStationFilter("medico")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            stationFilter === "medico"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-transparent text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted"
          }`}
        >
          <HeartPulse className="size-3" />
          Médico
        </button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 grid place-items-center bg-background/50 backdrop-blur-sm z-10">
          <span className="text-xs text-muted-foreground font-mono">Cargando incidentes...</span>
        </div>
      )}

      {/* Selected Vehicle Float Card */}
      {selectedTracking && (
        <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 bg-card/95 backdrop-blur border border-blue-500/30 p-5 rounded-none shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
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
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 font-sans">
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

      {/* Selected Report Float Card */}
      {selectedReport && !selectedTracking && (
        <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 bg-card/95 backdrop-blur border border-border p-5 rounded-none shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between mb-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${
                selectedReport.verified
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {selectedReport.verified ? "Verificado" : "Pendiente"}
            </span>
            <button
              onClick={() => setSelectedReportId(null)}
              className="size-6 rounded-none hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {selectedReport.images?.[0]?.url && (
            <div
              onClick={() => {
                setCarouselImages(selectedReport.images);
                setCarouselInitialIndex(0);
                setCarouselActiveIndex(0);
                setCarouselOpen(true);
              }}
              className="relative h-32 rounded-none overflow-hidden border border-border mb-3 cursor-pointer group"
            >
              <img
                src={selectedReport.images[0].url}
                alt={selectedReport.type?.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <span className="text-[10px] text-white font-bold uppercase tracking-wider bg-black/60 px-3 py-1.5 border border-white/20">
                  Ampliar foto
                </span>
              </div>
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
            <div>ID: {selectedReport.id}</div>
            <div className="col-span-2">FECHA: {new Date(selectedReport.created_at).toLocaleDateString()}</div>
          </div>

          <div className="flex gap-2">
            {!selectedReport.verified && (
              <Button
                onClick={() => handleVerify(selectedReport)}
                disabled={isVerifying}
                size="sm"
                className="flex-1 rounded-none font-bold gap-2 cursor-pointer"
              >
                <Check className="size-3.5" />
                {isVerifying ? "Verificando..." : "Confirmar Veracidad"}
              </Button>
            )}
            <Button
              onClick={() => setDeleteTargetId(selectedReport.id)}
              disabled={isDeletingReport}
              variant="destructive"
              size="sm"
              className="rounded-none font-bold gap-2 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              Eliminar
            </Button>
          </div>
        </div>
      )}

      {/* Floating Status / Info overlays */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-background/90 backdrop-blur border border-border/40 text-[10px] font-bold uppercase tracking-widest shadow-md">
          <Radio className="size-3 text-primary animate-pulse" />
          Vista activa · {filteredReports.length} en mapa
        </div>
        {pickOnMainMap && (
          <div className="px-3 py-1.5 rounded-none bg-primary/95 text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-md">
            Clic en el mapa para ubicar la alerta
          </div>
        )}
      </div>

      {/* Floating Action and Map Control Overlays */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        {/* Mapbox Controls */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleZoomIn}
            title="Acercar"
            className="size-9 rounded-none bg-background/80 backdrop-blur border border-border/40 grid place-items-center hover:bg-card transition-colors cursor-pointer shadow-md"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Alejar"
            className="size-9 rounded-none bg-background/80 backdrop-blur border border-border/40 grid place-items-center hover:bg-card transition-colors cursor-pointer shadow-md"
          >
            <Minus className="size-4" />
          </button>
          <button
            onClick={handleToggle3D}
            title="Alternar Vista 3D / 2D"
            className="size-9 rounded-none bg-background/80 backdrop-blur border border-border/40 grid place-items-center hover:bg-card transition-colors cursor-pointer shadow-md"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <Button
            onClick={() => setAlertsListOpen(true)}
            className="size-9 p-0 rounded-none gap-2 font-bold cursor-pointer shadow-md bg-background/80 hover:bg-card text-foreground border border-border"
            variant="secondary"
            title="Ver alertas"
          >
            <List className="size-4" />
          </Button>
          <Button
            onClick={() => {
              setPendingLocation(null);
              setCreateOpen(true);
            }}
            className="size-9 p-0 rounded-none gap-2 font-bold cursor-pointer shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            title="Nueva alerta"
          >
            <PlusCircle className="size-4" />
          </Button>
          <Button
            onClick={handleRefresh}
            variant="secondary"
            className="size-9 p-0 rounded-none gap-2 border border-border cursor-pointer shadow-md bg-background/80 hover:bg-card text-foreground"
            title="Actualizar"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] text-muted-foreground z-10 pointer-events-none font-mono">
        <MapPin className="size-3" />
        Santa Cruz de la Sierra · Bolivia
      </div>

      {/* Alerts List Sheet */}
      <Sheet open={alertsListOpen} onOpenChange={setAlertsListOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto rounded-none bg-background border-border p-0">
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-none">
                Registro
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {filteredReports.length} incidentes
              </span>
            </div>
            <SheetTitle className="font-display text-lg tracking-tight">Alertas activas</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Selecciona un incidente para visualizarlo en el mapa.
            </SheetDescription>
          </SheetHeader>

          <div className="divide-y divide-border">
            {filteredReports.length === 0 && (
              <div className="px-5 py-10 text-center text-xs text-muted-foreground">
                No hay incidentes registrados.
              </div>
            )}
            {filteredReports.map((report) => {
              const config = getCategoryMarkerConfig(report.type?.name);
              return (
                <button
                  key={report.id}
                  onClick={() => {
                    const pos = normalizeReportCoordinates(report.coordinates);
                    if (pos) {
                      const [lng, lat] = pos;
                      setSelectedReportId(report.id);
                      setSelectedTrackingId(null);
                      setAlertsListOpen(false);
                      map?.flyTo({
                        center: [lng, lat],
                        zoom: 15.5,
                        pitch: 50,
                        speed: 1.2,
                      });
                    }
                  }}
                  className={`w-full text-left px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer flex items-start gap-3 ${
                    selectedReportId === report.id ? "bg-muted/70" : ""
                  }`}
                >
                  {/* Color indicator */}
                  <div
                    className="size-8 shrink-0 grid place-items-center border border-border rounded-none mt-0.5"
                    style={{ backgroundColor: config.color }}
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: config.iconPaths }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold truncate">
                        {report.type?.name || "Incidente"}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider rounded-none border ${
                        report.verified
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {report.verified ? <Shield className="size-2.5" /> : <Clock className="size-2.5" />}
                        {report.verified ? "OK" : "Pend."}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">
                      {report.description || "Sin descripción"}
                    </p>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
                      <span>#{report.id}</span>
                      {report.zone && <span>{report.zone}</span>}
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <VerifyEvidenceDialog
        report={verifyTarget}
        open={!!verifyTarget}
        onOpenChange={(open) => !open && setVerifyTarget(null)}
        onConfirm={handleConfirmVerify}
        isVerifying={isVerifying}
        isAdmin={isAdmin}
      />

      <DeleteConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId !== null) {
            await handleDeleteReport(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        isLoading={isDeletingReport}
      />

      <ImageCarouselDialog
        images={carouselImages}
        initialIndex={carouselInitialIndex}
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
        activeIndex={carouselActiveIndex}
        setActiveIndex={setCarouselActiveIndex}
      />

      <CreateAlertSheet
        open={createOpen}
        riskZones={[]} // pass empty array as riskZones is not strictly needed for this layout or is fetched independently
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
          setStationFilter("todos");
        }}
      />
    </div>
  );
}