import { useState, type FormEvent } from "react";
import { Loader2, Building2, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPickerMap, type MapLocation } from "@/components/admin/LocationPickerMap";
import { ActionConfirmDialog } from "@/components/admin/ActionConfirmDialog";
import { useEmergencyStations } from "@/hooks/useEmergencyStations";
import { toast } from "sonner";

interface CreateEmergencyStationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateEmergencyStationSheet({
  open,
  onOpenChange,
  onCreated,
}: CreateEmergencyStationSheetProps) {
  const { createStation, isCreating } = useEmergencyStations();

  const [name, setName] = useState("");
  const [installationType, setInstallationType] = useState<string>("policia");
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const resetForm = () => {
    setName("");
    setInstallationType("policia");
    setLocation(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre de la estación es requerido");
      return;
    }
    if (!location) {
      toast.error("Selecciona la ubicación en el mapa");
      return;
    }

    setConfirmOpen(true);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto border-border rounded-none bg-background flex flex-col h-full"
      >
        <SheetHeader className="mb-0 pr-8 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-none">
              Registro
            </span>
          </div>
          <SheetTitle className="font-display text-lg tracking-tight">Nueva estación de emergencia</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Registra una nueva estación de emergencia. Especifica el nombre, el tipo de servicio y marca su ubicación exacta en el mapa.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-0 flex-1 flex flex-col pb-8">
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Nombre */}
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label htmlFor="station-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Nombre de la estación
              </Label>
              <Input
                id="station-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej. Estación Central Policial - Norte"
                className="rounded-none border-border"
              />
            </div>

            {/* Tipo de Servicio */}
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Tipo de instalación
              </Label>
              <Select value={installationType} onValueChange={setInstallationType}>
                <SelectTrigger className="rounded-none border-border">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="policia">Policía</SelectItem>
                  <SelectItem value="bombero">Bombero</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ubicación en el mapa */}
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Ubicación en el mapa
              </Label>
              <div className="border border-border rounded-none overflow-hidden">
                <LocationPickerMap
                  value={location}
                  onChange={setLocation}
                  className="h-[240px]"
                  resizeKey={open}
                />
              </div>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="pt-5 mt-auto">
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full rounded-none font-bold gap-2 cursor-pointer uppercase tracking-wider text-xs h-11"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creando estación...
                </>
              ) : (
                <>
                  <Building2 className="size-4" />
                  Registrar Estación
                </>
              )}
            </Button>
          </div>
        </form>

        <ActionConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={async () => {
            if (location) {
              try {
                await createStation({
                  name: name.trim(),
                  installation_type: installationType,
                  latitude: location.latitude,
                  longitude: location.longitude,
                });
                toast.success("Estación de emergencia creada con éxito.");
                resetForm();
                onOpenChange(false);
                onCreated?.();
              } catch (err: any) {
                toast.error(err.message || "Error al registrar la estación");
              } finally {
                setConfirmOpen(false);
              }
            }
          }}
          isLoading={isCreating}
          title="¿Registrar esta estación de emergencia?"
          description="Esta acción registrará la estación con la ubicación marcada en el mapa y la habilitará para atender despachos."
          confirmText="Registrar"
          icon={<MapPin className="size-5 text-primary" />}
        />
      </SheetContent>
    </Sheet>
  );
}
