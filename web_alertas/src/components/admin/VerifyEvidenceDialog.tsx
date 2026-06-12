import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Report } from "@/domain/types";
import { MIN_DISTINCT_CONTRIBUTORS } from "@/lib/security";
import { AlertTriangle, Check, Users } from "lucide-react";

interface VerifyEvidenceDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isVerifying?: boolean;
  isAdmin?: boolean;
}

export function VerifyEvidenceDialog({
  report,
  open,
  onOpenChange,
  onConfirm,
  isVerifying,
  isAdmin,
}: VerifyEvidenceDialogProps) {
  if (!report) return null;

  const contributors = report.distinct_contributors ?? countContributors(report);
  const canVerify = isAdmin || contributors >= MIN_DISTINCT_CONTRIBUTORS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Revisar evidencias · #{report.id}</DialogTitle>
          <DialogDescription>
            {report.type?.name} — {report.zone}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
          <Users className="size-4 text-primary shrink-0" />
          <span>
            <strong>{contributors}</strong> usuario(s) distintos con foto
            {!canVerify && !isAdmin && (
              <span className="text-amber-400"> · mínimo {MIN_DISTINCT_CONTRIBUTORS}</span>
            )}
          </span>
        </div>

        {report.images?.length ? (
          <ul className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
            {report.images.map((img) => (
              <li key={img.id} className="rounded-xl border border-border overflow-hidden">
                <img src={img.url} alt="" className="w-full h-28 object-cover bg-muted" />
                <p className="text-[10px] px-2 py-1.5 text-muted-foreground truncate">
                  {img.uploadedBy
                    ? `${img.uploadedBy.first_name} ${img.uploadedBy.last_name}`
                    : "Usuario desconocido"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">Sin imágenes adjuntas.</p>
        )}

        {!canVerify && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            Se necesitan al menos {MIN_DISTINCT_CONTRIBUTORS} usuarios distintos con evidencia.
            {isAdmin ? " Como admin puedes verificar de todas formas." : ""}
          </div>
        )}

        {report.verified_by && (
          <p className="text-xs text-muted-foreground">
            Verificado por {report.verified_by.first_name} {report.verified_by.last_name}
            {report.verified_at && ` · ${new Date(report.verified_at).toLocaleString()}`}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canVerify || isVerifying || report.verified}
            onClick={onConfirm}
            className="rounded-xl gap-2"
          >
            <Check className="size-4" />
            {isVerifying ? "Verificando…" : "Confirmar veracidad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function countContributors(report: Report): number {
  const ids = new Set<string>();
  if (report.creator) ids.add(report.creator);
  for (const img of report.images ?? []) {
    if (img.uploadedBy?.id) ids.add(img.uploadedBy.id);
  }
  return ids.size;
}
