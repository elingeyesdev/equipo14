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
import { findZoneNameAtPoint, normalizeReportCoordinates } from "@/lib/geo";
import { type Zone } from "@/domain/types";
import { toast } from "sonner";

interface CreateAlertSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ubicación inicial (p. ej. desde clic en mapa principal) */
  initialLocation?: MapLocation | null;
  demarcatedZones?: Zone[];
  onCreated?: () => void;
}

export function CreateAlertSheet({
  open,
  onOpenChange,
  initialLocation = null,
  demarcatedZones = [],
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
    const name = findZoneNameAtPoint(
      location.longitude,
      location.latitude,
      demarcatedZones,
    );
    if (name) setZone(name);
  }, [location, demarcatedZones]);

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
        className="w-full sm:max-w-xl overflow-y-auto border-border"
      >
        <SheetHeader className="mb-6 pr-8">
          <SheetTitle className="font-display">Nueva alerta</SheetTitle>
          <SheetDescription>
            Registra un incidente oficial. Selecciona el punto en el mapa y completa los datos.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pb-8">
          <div className="space-y-2">
            <Label htmlFor="alert-type">Tipo de incidente</Label>
            <Select value={typeId} onValueChange={setTypeId} disabled={loadingTypes}>
              <SelectTrigger id="alert-type" className="rounded-xl">
                <SelectValue placeholder={loadingTypes ? "Cargando..." : "Seleccionar tipo"} />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-desc">Descripción</Label>
            <Textarea
              id="alert-desc"
              placeholder="Detalla qué ocurrió, referencias visibles, gravedad..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={250}
              rows={3}
              className="rounded-xl resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {description.length}/250
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-zone" className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              Zona (se completa si cae dentro de una demarcada)
            </Label>
            <Input
              id="alert-zone"
              placeholder="Ej. Equipetrol, Centro, Plan 3000"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Ubicación en el mapa</Label>
            <LocationPickerMap
              value={location}
              onChange={handleLocationChange}
              className="h-[240px]"
              resizeKey={open}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-image" className="flex items-center gap-1.5">
              <ImagePlus className="size-3.5" />
              Evidencia fotográfica
            </Label>
            <Input
              id="alert-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="rounded-xl cursor-pointer"
            />
            {imagePreview && (
              <div className="relative h-28 rounded-xl overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isCreating}
            className="w-full rounded-xl font-bold gap-2 cursor-pointer"
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
        </form>
      </SheetContent>
    </Sheet>
  );
}
