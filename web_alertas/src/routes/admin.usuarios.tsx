import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Trash2, PlusCircle, Copy, Check } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";
import { roleBadgeClass, roleLabel } from "@/lib/roles";
import { CreateAuthoritySheet } from "@/components/admin/CreateAuthoritySheet";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/domain/types";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const { users = [], isLoading, deleteUser, isDeleting, refetch } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [copiedUuid, setCopiedUuid] = useState(false);

  const baseUsers = users.filter((u) => u.role?.name?.toLowerCase() !== "admin");

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("¿Estás seguro que deseas eliminar este usuario?")) return;
    try {
      await deleteUser(id);
      toast.success("Usuario eliminado.");
      if (selectedUser?.id === id) setSelectedUser(null);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar usuario");
    }
  };

  const copyUserUuid = async () => {
    if (!selectedUser) return;
    await navigator.clipboard.writeText(selectedUser.id);
    setCopiedUuid(true);
    toast.success("UUID copiado al portapapeles.");
    window.setTimeout(() => setCopiedUuid(false), 2000);
  };

  const totalCount = baseUsers.length;
  const usuarioCount = baseUsers.filter((u) => u.role?.name?.toLowerCase() === "usuario").length;
  const autoridadCount = baseUsers.filter((u) => u.role?.name?.toLowerCase() === "autoridad").length;

  const cards = [
    { label: "Total de usuarios", value: totalCount.toString(), borderClass: "border-t-blue-500/80", dotClass: "bg-blue-50" },
    { label: "Usuarios normales", value: usuarioCount.toString(), borderClass: "border-t-purple-500/80", dotClass: "bg-purple-500" },
    { label: "Autoridades", value: autoridadCount.toString(), borderClass: "border-t-emerald-500/80", dotClass: "bg-emerald-50" },
  ];

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground truncate block max-w-[110px]">
          {String(getValue()).slice(0, 8)}…
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ getValue }) => <span className="font-mono">{String(getValue())}</span>,
    },
    {
      id: "fullName",
      header: "Nombre completo",
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row }) => {
        const auth = row.original.authority_profile;
        return (
          <div className="flex flex-col">
            <span className="font-medium capitalize">
              {row.original.first_name} {row.original.last_name}
            </span>
            {auth && (
              <span className="text-[10px] text-muted-foreground">
                CI: {auth.ci} · {auth.gmail}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "role",
      header: "Rol / Perfil",
      accessorFn: (row) => row.role?.name ?? "",
      cell: ({ row }) => {
        const auth = row.original.authority_profile;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass(row.original.role)}`}>
              {roleLabel(row.original.role?.name)}
            </span>
            {auth?.profile_type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {auth.profile_type === "policia" ? "Policía" : auth.profile_type === "bombero" ? "Bombero" : "Paramédico"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteUser(row.original.id);
            }}
            disabled={isDeleting}
            title="Eliminar"
            className="size-8 rounded-none border border-border hover:border-destructive hover:text-destructive grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Gestión de cuentas
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Usuarios del sistema
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualiza y administra a todos los usuarios registrados y autoridades.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} className="rounded-none gap-2 font-bold cursor-pointer">
            <PlusCircle className="size-4" />
            Nueva autoridad
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-card/40 backdrop-blur border border-border border-t-2 ${c.borderClass} p-6 rounded-none shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                {c.label}
              </span>
              <span className={`size-1.5 rounded-none animate-pulse ${c.dotClass}`} />
            </div>
            <div className="font-display text-4xl font-bold leading-none">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={baseUsers}
        isLoading={isLoading}
        emptyMessage="Ningún usuario encontrado."
        footerText={`${baseUsers.length} usuarios mostrados · clic en fila para ver UUID`}
        onRowClick={setSelectedUser}
      />

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md rounded-none sm:rounded-none">
          <DialogHeader>
            <DialogTitle>Detalle del usuario</DialogTitle>
            <DialogDescription>
              UUID necesario para simular tracking u otras integraciones.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Nombre
                </p>
                <p className="font-medium capitalize">
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Teléfono
                </p>
                <p className="font-mono">{selectedUser.phone}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Rol
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass(selectedUser.role)}`}>
                  {roleLabel(selectedUser.role?.name)}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  UUID
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded-none break-all border border-border">
                    {selectedUser.id}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 cursor-pointer"
                    onClick={copyUserUuid}
                    title="Copiar UUID"
                  >
                    {copiedUuid ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreateAuthoritySheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => refetch?.()}
      />
    </div>
  );
}
