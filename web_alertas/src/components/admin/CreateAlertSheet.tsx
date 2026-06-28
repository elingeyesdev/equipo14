import { useState, useEffect, type FormEvent } from "react";
import { Loader2, MapPin, ImagePlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPickerMap, type MapLocation } from "@/components/admin/LocationPickerMap";
import { useReportTypes } from "@/hooks/useReportTypes";
import { useReports } from "@/hooks/useReports";
import { reportsService } from "@/services/reports.service";
import { getSession } from "@/api/httpClient";
import { findRiskZoneAtPoint, normalizeReportCoordinates } from "@/lib/geo";
import { type RiskZone } from "@/lib/risk-zones";
import { toast } from "sonner";

interface CreateAlertSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ubicación inicial (p. ej. desde clic en mapa principal) */
  initialLocation?: MapLocation | null;
  riskZones?: RiskZone[];
  onCreated?: () => void;
}

export function CreateAlertSheet({
  open,
  onOpenChange,
  initialLocation = null,
  riskZones = [],
  onCreated,
}: CreateAlertSheetProps) {
  const { reportTypes, isLoading: loadingTypes } = useReportTypes({ enabled: open });
  const { createReport, isCreating } = useReports({}, { enabled: false });

  const [typeId, setTypeId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState("");
  const [location, setLocation] = useState<MapLocation | null>(initialLocation);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && initialLocation) {
      setLocation(initialLocation);
    }
  }, [open, initialLocation]);

  useEffect(() => {
    if (!location) return;
    const matchingZone = findRiskZoneAtPoint(
      location.longitude,
      location.latitude,
      riskZones,
    );
    if (matchingZone) {
      setZone(matchingZone.name);
      return;
    }

    let active = true;
    const fetchAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "web_alertas/1.0 (web reverse geocoding)",
            },
          }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !data || !data.address) return;

        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.residential || addr.suburb || addr.neighbourhood;
        const suburb = addr.neighbourhood || addr.suburb || addr.city_district;

        let addressText = "";
        if (road && suburb) {
          addressText = `${road}, ${suburb}`;
        } else {
          addressText = road || suburb || data.display_name || "";
        }

        if (addressText) {
          setZone(addressText);
        }
      } catch (error) {
        console.error("Error in reverse geocoding:", error);
      }
    };

    fetchAddress();

    return () => {
      active = false;
    };
  }, [location, riskZones]);

  const handleLocationChange = (loc: MapLocation) => {
    const norm = normalizeReportCoordinates([loc.longitude, loc.latitude]);
    if (norm) {
      setLocation({ longitude: norm[0], latitude: norm[1] });
    } else {
      setLocation(loc);
    }
  };

  const resetForm = () => {
    setTypeId("");
    setDescription("");
    setZone("");
    setLocation(initialLocation);
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    else if (initialLocation) setLocation(initialLocation);
    onOpenChange(next);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const session = getSession();
    if (!session?.user?.id) {
      toast.error("Sesión no válida. Inicia sesión de nuevo.");
      return;
    }
    if (!typeId) {
      toast.error("Selecciona el tipo de alerta");
      return;
    }
    if (!description.trim()) {
      toast.error("Escribe una descripción");
      return;
    }
    if (!location) {
      toast.error("Marca la ubicación en el mapa");
      return;
    }
    if (!imageFile) {
      toast.error("Adjunta una imagen del incidente");
      return;
    }

    try {
      const formData = reportsService.buildCreateFormData({
        typeId: Number(typeId),
        description: description.trim(),
        userId: session.user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        zone: zone.trim() || undefined,
        image: imageFile,
      });

      await createReport(formData);
      toast.success("Alerta creada correctamente");
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo crear la alerta";
      toast.error(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto border-border rounded-none bg-background"
      >
        <SheetHeader className="mb-0 pr-8 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-none">
              Registro
            </span>
          </div>
          <SheetTitle className="font-display text-lg tracking-tight">Nueva alerta</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Registra un incidente oficial. Selecciona el punto en el mapa y completa los datos.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-0 pb-8">
          {/* Tipo de incidente */}
          <div className="px-0 py-4 border-b border-border space-y-2">
            <Label htmlFor="alert-type" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tipo de incidente
            </Label>
            <Select value={typeId} onValueChange={setTypeId} disabled={loadingTypes}>
              <SelectTrigger id="alert-type" className="rounded-none border-border">
                <SelectValue placeholder={loadingTypes ? "Cargando..." : "Seleccionar tipo"} />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {reportTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="px-0 py-4 border-b border-border space-y-2">
            <Label htmlFor="alert-desc" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Descripción
            </Label>
            <Textarea
              id="alert-desc"
              placeholder="Detalla qué ocurrió, referencias visibles, gravedad..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={250}
              rows={3}
              className="rounded-none resize-none border-border"
            />
            <p className="text-[10px] text-muted-foreground text-right font-mono">
              {description.length}/250
            </p>
          </div>

          {/* Zona */}
          <div className="px-0 py-4 border-b border-border space-y-2">
            <Label htmlFor="alert-zone" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <MapPin className="size-3" />
              Zona
            </Label>
            <Input
              id="alert-zone"
              placeholder="Ej. Equipetrol, Centro, Plan 3000"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="rounded-none border-border"
            />
            <p className="text-[10px] text-muted-foreground">
              Se completa automáticamente si la ubicación cae dentro de una zona demarcada.
            </p>
          </div>

          {/* Ubicación en el mapa */}
          <div className="px-0 py-4 border-b border-border space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Ubicación en el mapa
            </Label>
            <div className="border border-border rounded-none overflow-hidden">
              <LocationPickerMap
                value={location}
                onChange={handleLocationChange}
                className="h-[240px]"
                resizeKey={open}
              />
            </div>
          </div>

          {/* Evidencia fotográfica */}
          <div className="px-0 py-4 border-b border-border space-y-2">
            <Label htmlFor="alert-image" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <ImagePlus className="size-3" />
              Evidencia fotográfica
            </Label>
            <Input
              id="alert-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="rounded-none cursor-pointer border-border"
            />
            {imagePreview && (
              <div className="relative h-28 rounded-none overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-5">
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full rounded-none font-bold gap-2 cursor-pointer uppercase tracking-wider text-xs h-11"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Publicando alerta...
                </>
              ) : (
                "Crear alerta"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
