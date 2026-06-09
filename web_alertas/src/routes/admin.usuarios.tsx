import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Trash2, PlusCircle } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";
import { roleBadgeClass, roleLabel } from "@/lib/roles";
import { CreateAuthoritySheet } from "@/components/admin/CreateAuthoritySheet";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import type { User } from "@/domain/types";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const { users = [], isLoading, deleteUser, isDeleting, refetch } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);

  const filteredUsers = users.filter((u) => u.role?.name?.toLowerCase() !== "admin");

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("¿Estás seguro que deseas eliminar este usuario?")) return;
    try {
      await deleteUser(id);
      toast.success("Usuario eliminado.");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar usuario");
    }
  };

  const totalCount = filteredUsers.length;
  const usuarioCount = filteredUsers.filter((u) => u.role?.name?.toLowerCase() === "usuario").length;
  const autoridadCount = filteredUsers.filter((u) => u.role?.name?.toLowerCase() === "autoridad").length;

  const cards = [
    { label: "Total de usuarios", value: totalCount.toString() },
    { label: "Usuarios normales", value: usuarioCount.toString() },
    { label: "Autoridades", value: autoridadCount.toString() },
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
      cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span>,
    },
    {
      id: "role",
      header: "Rol",
      accessorFn: (row) => row.role?.name ?? "",
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass(row.original.role)}`}>
          {roleLabel(row.original.role?.name)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            onClick={() => handleDeleteUser(row.original.id)}
            disabled={isDeleting}
            title="Eliminar"
            className="size-8 rounded-lg border border-border hover:border-destructive hover:text-destructive grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
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
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2 font-bold cursor-pointer">
            <PlusCircle className="size-4" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-6">
            <div className="font-display text-4xl font-bold text-primary mb-1 leading-none">{c.value}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{c.label}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        emptyMessage="Ningún usuario encontrado."
        footerText={`${filteredUsers.length} usuarios mostrados`}
      />

      <CreateAuthoritySheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => refetch?.()}
      />
    </div>
  );
}
