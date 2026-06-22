import { useState, type FormEvent, useEffect } from "react";
import { Loader2, Edit3 } from "lucide-react";
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
import { ActionConfirmDialog } from "@/components/admin/ActionConfirmDialog";
import { toast } from "sonner";
import type { User } from "@/domain/types";
import { useUsers } from "@/hooks/useUsers";

interface EditAuthorityProfileSheetProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export function EditAuthorityProfileSheet({
  user,
  onOpenChange,
}: EditAuthorityProfileSheetProps) {
  const { updateAuthorityProfile, isUpdatingAuthorityProfile } = useUsers({ enabled: false });

  const [ci, setCi] = useState("");
  const [gmail, setGmail] = useState("");
  const [profileType, setProfileType] = useState<string>("policia");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (user && user.authority_profile) {
      setCi(user.authority_profile.ci);
      setGmail(user.authority_profile.gmail);
      setProfileType(user.authority_profile.profile_type);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!ci.trim()) {
      toast.error("El CI es requerido");
      return;
    }

    if (!gmail.trim() || !gmail.includes("@")) {
      toast.error("Ingresa un correo de Gmail válido");
      return;
    }

    setConfirmOpen(true);
  };

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onOpenChange(false)}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto border-border rounded-none bg-background"
      >
        <SheetHeader className="mb-0 pr-8 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-none">
              Acciones
            </span>
          </div>
          <SheetTitle className="font-display text-lg tracking-tight">Editar Perfil Profesional</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Modifica la información profesional del perfil de la autoridad seleccionada.
          </SheetDescription>
        </SheetHeader>

        {user && (
          <form onSubmit={handleSubmit} className="space-y-0 pb-8">
            {/* CI */}
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label htmlFor="edit-ci" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Cédula de Identidad (CI)
              </Label>
              <Input
                id="edit-ci"
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                required
                className="rounded-none border-border"
                placeholder="Ej. 1234567"
              />
            </div>

            {/* Correo Electrónico (Gmail) */}
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label htmlFor="edit-gmail" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Correo Electrónico (Gmail)
              </Label>
              <Input
                id="edit-gmail"
                type="email"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                required
                className="rounded-none border-border"
                placeholder="ejemplo@gmail.com"
              />
            </div>

            {/* Tipo de Perfil */}
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Tipo de Perfil
              </Label>
              <Select value={profileType} onValueChange={setProfileType}>
                <SelectTrigger className="rounded-none border-border">
                  <SelectValue placeholder="Seleccionar perfil" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="policia">Policía</SelectItem>
                  <SelectItem value="bombero">Bombero</SelectItem>
                  <SelectItem value="paramedico">Paramédico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón de envío */}
            <div className="pt-5">
              <Button
                type="submit"
                disabled={isUpdatingAuthorityProfile}
                className="w-full rounded-none font-bold gap-2 cursor-pointer uppercase tracking-wider text-xs h-11"
              >
                {isUpdatingAuthorityProfile ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Actualizando perfil...
                  </>
                ) : (
                  <>
                    <Edit3 className="size-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        <ActionConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={async () => {
            if (user) {
              try {
                await updateAuthorityProfile({
                  userId: user.id,
                  data: {
                    ci: ci.trim(),
                    gmail: gmail.trim(),
                    profile_type: profileType,
                  },
                });

                toast.success("Perfil de autoridad actualizado exitosamente.");
                onOpenChange(false);
              } catch (err: any) {
                toast.error(err.message || "Error al actualizar el perfil de la autoridad");
              } finally {
                setConfirmOpen(false);
              }
            }
          }}
          isLoading={isUpdatingAuthorityProfile}
          title="¿Guardar cambios del perfil?"
          description="Esta acción actualizará los datos profesionales del perfil de la autoridad."
          confirmText="Guardar"
        />
      </SheetContent>
    </Sheet>
  );
}
