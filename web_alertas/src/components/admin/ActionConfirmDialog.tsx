import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface ActionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  icon?: ReactNode;
}

export function ActionConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  title,
  description,
  confirmText,
  cancelText = "Cancelar",
  variant = "default",
  icon,
}: ActionConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-none sm:rounded-none max-w-md bg-background border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className={`font-display flex items-center gap-2 ${variant === "destructive" ? "text-destructive" : "text-foreground"}`}>
            {icon}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading} className="rounded-none">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={`rounded-none font-bold gap-2 cursor-pointer ${
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
