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
import { getSession } from "@/api/httpClient";
import { creatableRolesFor, ROLE_IDS, type CreatableRoleId } from "@/lib/roles";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";

interface CreateUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateUserSheet({
  open,
  onOpenChange,
  onCreated,
}: CreateUserSheetProps) {
  const { createUser, isCreating } = useUsers({ enabled: false });

  const session = getSession();
  const roleOptions = creatableRolesFor(session?.user?.role);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<string>(String(ROLE_IDS.USUARIO));

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setPassword("");
    setRoleId(String(ROLE_IDS.USUARIO));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedPhone = phone.replace(/\D/g, "");
    if (trimmedPhone.length !== 8) {
      toast.error("El teléfono debe tener 8 dígitos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      await createUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: trimmedPhone,
        password,
        roleId: Number(roleId) as CreatableRoleId,
      });
      toast.success("Usuario creado correctamente");
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el usuario");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Nuevo usuario
          </SheetTitle>
          <SheetDescription>
            Crea un usuario normal (app móvil) o administrativo (panel web).
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="user-first-name">Nombre</Label>
              <Input
                id="user-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-last-name">Apellido</Label>
              <Input
                id="user-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-phone">Teléfono (8 dígitos)</Label>
            <Input
              id="user-phone"
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

          <div className="space-y-2">
            <Label htmlFor="user-password">Contraseña</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              maxLength={20}
              required
              autoComplete="new-password"
              className="rounded-xl"
            />
            <p className="text-[10px] text-muted-foreground">
              Mínimo 6 caracteres, sin espacios.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tipo de usuario</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.id} value={String(opt.id)}>
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      — {opt.hint}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isCreating}
            className="w-full rounded-xl font-bold gap-2 cursor-pointer"
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
  );
}
