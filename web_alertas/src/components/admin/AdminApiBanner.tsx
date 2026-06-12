import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminApiBannerProps {
  message: string;
  onRetry?: () => void;
}

export function AdminApiBanner({ message, onRetry }: AdminApiBannerProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-400" />
        <p className="leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="rounded-xl gap-2 shrink-0 border-amber-500/40 text-amber-100 hover:bg-amber-500/10 cursor-pointer"
        >
          <RefreshCw className="size-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
