import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
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
import { toast } from "sonner";
import { httpClient } from "@/api/httpClient";

interface CreateAuthoritySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateAuthoritySheet({
  open,
  onOpenChange,
  onCreated,
}: CreateAuthoritySheetProps) {
  const [isCreating, setIsCreating] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [ci, setCi] = useState("");
  const [gmail, setGmail] = useState("");
  const [profileType, setProfileType] = useState<string>("policia");

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setCi("");
    setGmail("");
    setProfileType("policia");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedPhone = phone.replace(/\D/g, "");
    if (trimmedPhone.length !== 8) {
      toast.error("El teléfono debe tener 8 dígitos");
      return;
    }

    if (!ci.trim()) {
      toast.error("El CI es requerido");
      return;
    }

    if (!gmail.trim() || !gmail.includes("@")) {
      toast.error("Ingresa un correo de Gmail válido");
      return;
    }

    // Generate random 8-char password
    const newPassword = Math.random().toString(36).slice(-8);

    setIsCreating(true);
    try {
      await httpClient.post("/users/authority", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: trimmedPhone,
        password: newPassword,
        roleId: 2, // always autoridad
        ci: ci.trim(),
        gmail: gmail.trim(),
        profile_type: profileType,
      });

      toast.success("Autoridad creada con éxito. Las credenciales se han enviado al correo registrado.");
      
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la autoridad");
    } finally {
      setIsCreating(false);
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
              Cuentas
            </span>
          </div>
          <SheetTitle className="font-display text-lg tracking-tight">Nueva autoridad</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Registra una nueva cuenta de autoridad en el sistema. Las credenciales se enviarán automáticamente a su correo electrónico de Gmail.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-0 pb-8">
          {/* Nombre y Apellido */}
          <div className="px-0 py-4 border-b border-border grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auth-first-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Nombre
              </Label>
              <Input
                id="auth-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                className="rounded-none border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-last-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Apellido
              </Label>
              <Input
                id="auth-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className="rounded-none border-border"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="px-0 py-4 border-b border-border space-y-2">
            <Label htmlFor="auth-phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Teléfono (8 dígitos)
            </Label>
            <Input
              id="auth-phone"
              type="tel"
              inputMode="numeric"
              maxLength={8}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="70000000"
              required
              className="rounded-none font-mono border-border"
            />
          </div>

          {/* Cédula de Identidad */}
          <div className="px-0 py-4 border-b border-border space-y-2">
            <Label htmlFor="auth-ci" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Cédula de Identidad (CI)
            </Label>
            <Input
              id="auth-ci"
              value={ci}
              onChange={(e) => setCi(e.target.value)}
              placeholder="Ej. 1234567"
              required
              className="rounded-none border-border"
            />
          </div>

          {/* Correo Electrónico */}
          <div className="px-0 py-4 border-b border-border space-y-2">
            <Label htmlFor="auth-gmail" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Correo Electrónico (Gmail)
            </Label>
            <Input
              id="auth-gmail"
              type="email"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              placeholder="ejemplo@gmail.com"
              required
              className="rounded-none border-border"
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
              disabled={isCreating}
              className="w-full rounded-none font-bold gap-2 cursor-pointer uppercase tracking-wider text-xs h-11"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Registrando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  Crear autoridad
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
