import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import type { ReportImage } from "@/domain/types";

interface ImageCarouselDialogProps {
  images: ReportImage[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function ImageCarouselDialog({
  images,
  initialIndex,
  open,
  onOpenChange,
  activeIndex,
  setActiveIndex,
}: ImageCarouselDialogProps) {
  useEffect(() => {
    if (open) {
      setActiveIndex(initialIndex);
    }
  }, [open, initialIndex, setActiveIndex]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, activeIndex, images]);

  if (!images || images.length === 0) return null;

  const currentImage = images[activeIndex] || images[0] || { url: "" };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-black/95 border-none text-white rounded-none sm:rounded-none overflow-hidden flex flex-col items-center justify-center min-h-[40vh]">
        <DialogTitle className="sr-only">Galería de imágenes</DialogTitle>
        <DialogDescription className="sr-only">Visualizador de fotos del reporte</DialogDescription>

        <div className="relative w-full aspect-[4/3] max-h-[70vh] flex items-center justify-center bg-black/40">
          {currentImage.url ? (
            <img
              src={currentImage.url}
              alt={`Evidencia ${activeIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
            />
          ) : (
            <div className="text-zinc-500 text-sm">Sin imagen disponible</div>
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-12 bg-black/60 hover:bg-black/80 border border-white/20 text-white rounded-none grid place-items-center transition-colors cursor-pointer"
                title="Imagen anterior"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-12 bg-black/60 hover:bg-black/80 border border-white/20 text-white rounded-none grid place-items-center transition-colors cursor-pointer"
                title="Imagen siguiente"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 text-xs font-mono border border-white/10 tracking-widest uppercase">
            {activeIndex + 1} / {images.length}
          </div>
        </div>

        <div className="w-full bg-zinc-950 p-4 border-t border-white/10 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <User className="size-3.5" />
            <span>Subido por:</span>
            <strong className="text-zinc-200">
              {currentImage.uploadedBy
                ? `${currentImage.uploadedBy.first_name} ${currentImage.uploadedBy.last_name}`
                : "Usuario desconocido"}
            </strong>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
