import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const PRESET_COLORS = [
  "#3b82f6",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#a855f7",
  "#06b6d4",
];

interface SaveZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coordinates: number[][] | null;
  onSave: (name: string, color: string, coordinates: number[][]) => Promise<void>;
}

export function SaveZoneDialog({
  open,
  onOpenChange,
  coordinates,
  onSave,
}: SaveZoneDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!coordinates?.length || !name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), color, coordinates);
      setName("");
      setColor(PRESET_COLORS[0]);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Guardar zona demarcada</DialogTitle>
          <DialogDescription>
            Se guardará un área circular de 2 km alrededor del centro de la zona en el mapa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zone-name">Nombre de la zona</Label>
            <Input
              id="zone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Centro, Plan 3000, Equipetrol"
              className="rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Color en el mapa</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-8 rounded-full border-2 transition-transform cursor-pointer ${
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !name.trim() || !coordinates?.length}
              className="rounded-xl font-bold gap-2 cursor-pointer"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar zona
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
