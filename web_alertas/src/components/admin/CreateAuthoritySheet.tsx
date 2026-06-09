import { useState, type FormEvent } from "react";
import { Loader2, UserPlus, Copy, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { httpClient } from "@/api/httpClient";
import { type CreatableRoleId } from "@/lib/roles";

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

  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [generatedPhone, setGeneratedPhone] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedPhone = phone.replace(/\D/g, "");
    if (trimmedPhone.length !== 8) {
      toast.error("El teléfono debe tener 8 dígitos");
      return;
    }

    // Generate random 8-char password
    const newPassword = Math.random().toString(36).slice(-8);

    setIsCreating(true);
    try {
      await httpClient.post("/auth/register", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: trimmedPhone,
        password: newPassword,
        roleId: 2, // always autoridad
      });
      
      setGeneratedPhone(trimmedPhone);
      setGeneratedPassword(newPassword);
      
      resetForm();
      onOpenChange(false);
      onCreated?.();
      
      // Open credentials dialog
      setCredentialsOpen(true);
      setCopied(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    const text = `Teléfono: ${generatedPhone}\nContraseña: ${generatedPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credenciales copiadas al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              Nueva autoridad
            </SheetTitle>
            <SheetDescription>
              Registra a una nueva autoridad. La contraseña se generará automáticamente.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="auth-first-name">Nombre</Label>
                <Input
                  id="auth-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-last-name">Apellido</Label>
                <Input
                  id="auth-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-phone">Teléfono (8 dígitos)</Label>
              <Input
                id="auth-phone"
                type="tel"
                inputMode="numeric"
                maxLength={8}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="70000000"
                required
                className="rounded-xl font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="w-full rounded-xl font-bold gap-2 cursor-pointer mt-6"
            >
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Crear usuario
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Autoridad creada con éxito</DialogTitle>
            <DialogDescription>
              Comparte estas credenciales con el usuario para que pueda acceder al panel. 
              La contraseña no podrá volver a verse después de cerrar este recuadro.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2 relative">
            <div>
              <span className="text-muted-foreground mr-2">Teléfono:</span>
              <span className="font-bold">{generatedPhone}</span>
            </div>
            <div>
              <span className="text-muted-foreground mr-2">Contraseña:</span>
              <span className="font-bold">{generatedPassword}</span>
            </div>
          </div>

          <DialogFooter className="sm:justify-between flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCredentialsOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              className="gap-2"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
