import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Layers, Radio, MapPin, Plus as ZoomIn, Minus, Maximize2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/context/FilterContext";
import { useReports } from "@/hooks/useReports";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/mapa")({
  component: MapaPage,
});

function MapaPage() {
  const { filters, setFilters } = useFilters();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Fetch reports based on active filters
  const { reports = [], isLoading, verifyReport, isVerifying } = useReports(filters);

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

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        await import("mapbox-gl/dist/mapbox-gl.css");
        
        mapboxgl.accessToken = "pk.eyJ1IjoiZWxvam9zZGVhcnJveiIsImEiOiJjbW5lbjNoZm4wMTRoMnNxM2RuZG1jdm9uIn0.nErIU6_OLUsQyg77y6geKA";

        mapInstance = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [-63.1812, -17.7833], // Center on Santa Cruz de la Sierra
          zoom: 12.5,
          pitch: 55, // 3D tilt
          bearing: -15,
          antialias: true
        });

        mapRef.current = mapInstance;

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

        // Add markers once the map is fully loaded
        mapInstance.on("load", () => {
          updateMarkers(mapboxgl);
        });
      } catch (err) {
        console.error("Error initializing Mapbox", err);
      }
    };

    initMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
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

      reports.forEach((report) => {
        const [lng, lat] = report.coordinates || [0, 0];
        if (!lng || !lat) return;

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

        el.addEventListener("click", () => {
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
    } catch (e) {
      console.error("Error drawing markers", e);
    }
  };

  // Re-run whenever reports list updates
  useEffect(() => {
    updateMarkers();
  }, [reports]);

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

  // Calculate dynamic zones from current reports
  const zonesMap: Record<string, { alerts: number; verified: number; color: string }> = {};
  const colors = [
    "bg-sky-400",
    "bg-amber-400",
    "bg-violet-400",
    "bg-rose-400",
    "bg-orange-300",
    "bg-emerald-400",
  ];

  reports.forEach((r) => {
    const zoneName = r.zone || "Zona desconocida";
    if (!zonesMap[zoneName]) {
      const colorIndex = Object.keys(zonesMap).length % colors.length;
      zonesMap[zoneName] = { alerts: 0, verified: 0, color: colors[colorIndex] };
    }
    zonesMap[zoneName].alerts += 1;
    if (r.verified) {
      zonesMap[zoneName].verified += 1;
    }
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
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setFilters((prev) => ({ ...prev, zone: "Todas" }))}
            className="rounded-xl gap-2 border border-border cursor-pointer"
          >
            <Layers className="size-4" />
            Todas las zonas
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar de Zonas */}
        <aside className="bg-card border border-border rounded-2xl p-5 self-start">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm">Zonas activas</h3>
            <span className="text-xs text-muted-foreground">{activeZones.length}</span>
          </div>
          
          <button
            onClick={() => setFilters((prev) => ({ ...prev, zone: "Todas" }))}
            className={`w-full text-left p-3 rounded-xl border mb-2 transition-colors cursor-pointer ${
              filters.zone === "Todas"
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
                <li key={z.name}>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, zone: z.name }))}
                    className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                      filters.zone === z.name
                        ? "bg-primary/10 border-primary/30"
                        : "border-transparent hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`size-2.5 rounded-full ${z.color}`} />
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

        {/* Mapa Real Mapbox 3D */}
        <div className="relative bg-card border border-border rounded-2xl overflow-hidden min-h-[520px] flex flex-col justify-end">
          {/* Mapbox container ref */}
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

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
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-border text-[10px] font-bold uppercase tracking-widest z-10">
            <Radio className="size-3 text-primary animate-pulse" />
            Vista activa · {reports.length} reportes
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
  );
}