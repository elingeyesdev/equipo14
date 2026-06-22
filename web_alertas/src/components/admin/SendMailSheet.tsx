import { useState, type FormEvent, useEffect } from "react";
import { Loader2, Mail } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ActionConfirmDialog } from "@/components/admin/ActionConfirmDialog";
import { toast } from "sonner";
import type { User } from "@/domain/types";
import { useUsers } from "@/hooks/useUsers";

interface SendMailSheetProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export function SendMailSheet({ user, onOpenChange }: SendMailSheetProps) {
  const { sendMail, isSendingMail } = useUsers({ enabled: false });
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setSubject("");
      setContent("");
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subject.trim()) {
      toast.error("El asunto es requerido");
      return;
    }
    if (!content.trim()) {
      toast.error("El contenido es requerido");
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
          <SheetTitle className="font-display text-lg tracking-tight">Enviar Correo</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Envía un correo electrónico directo a la autoridad seleccionada. El destinatario se extraerá automáticamente.
          </SheetDescription>
        </SheetHeader>

        {user && (
          <form onSubmit={handleSubmit} className="space-y-0 pb-8">
            {/* Recipient Information (Read Only) */}
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Destinatario
              </Label>
              <div className="font-mono text-xs bg-muted/30 border border-border p-3 space-y-1">
                <div>
                  <span className="text-muted-foreground uppercase mr-1">Nombre:</span>
                  <span className="font-semibold font-sans capitalize">{user.first_name} {user.last_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase mr-1">Email:</span>
                  <span className="font-semibold">{user.authority_profile?.gmail || "No registrado"}</span>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label htmlFor="mail-subject" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Asunto
              </Label>
              <Input
                id="mail-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="rounded-none border-border"
                placeholder="Ingresa el asunto del correo"
              />
            </div>

            {/* Content */}
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label htmlFor="mail-content" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Contenido
              </Label>
              <Textarea
                id="mail-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="rounded-none border-border min-h-[200px] resize-y"
                placeholder="Escribe el cuerpo del correo aquí..."
              />
            </div>

            {/* Send Button */}
            <div className="pt-5">
              <Button
                type="submit"
                disabled={isSendingMail}
                className="w-full rounded-none font-bold gap-2 cursor-pointer uppercase tracking-wider text-xs h-11"
              >
                {isSendingMail ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enviando correo...
                  </>
                ) : (
                  <>
                    <Mail className="size-4" />
                    Enviar correo
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
                await sendMail({
                  id: user.id,
                  subject: subject.trim(),
                  content: content.trim(),
                });
                toast.success("Correo enviado exitosamente.");
                onOpenChange(false);
              } catch (err: any) {
                toast.error(err.message || "Error al enviar el correo");
              } finally {
                setConfirmOpen(false);
              }
            }
          }}
          isLoading={isSendingMail}
          title="¿Enviar este correo?"
          description="Esta acción enviará el correo con el asunto y contenido ingresados al destinatario."
          confirmText="Enviar"
        />
      </SheetContent>
    </Sheet>
  );
}
