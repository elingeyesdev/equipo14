import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Download,
  RefreshCw,
  Check,
  Trash2,
  FileText,
  Users,
  Tag,
  Plus,
  Loader2,
  PlusCircle,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/context/FilterContext";
import { useReports } from "@/hooks/useReports";
import { useReportTypes } from "@/hooks/useReportTypes";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";
import { CreateAlertSheet } from "@/components/admin/CreateAlertSheet";
import { CreateUserSheet } from "@/components/admin/CreateUserSheet";
import { roleBadgeClass, roleLabel } from "@/lib/roles";

export const Route = createFileRoute("/admin/panel")({
  component: PanelPage,
});

function PanelPage() {
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState<"incidentes" | "tipos" | "usuarios">("incidentes");
  const [newTypeName, setNewTypeName] = useState("");
  const [createAlertOpen, setCreateAlertOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // Loading/pending state wrappers
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [isDeletingType, setIsDeletingType] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Queries loaded from domain presentation hook layer
  const { 
    reports = [], 
    isLoading: loadingReports, 
    verifyReport, 
    deleteReport,
    refetch: refetchReports
  } = useReports(filters, { enabled: activeTab === "incidentes" });

  const { 
    reportTypes = [], 
    isLoading: loadingTypes, 
    createReportType, 
    deleteReportType 
  } = useReportTypes({ enabled: activeTab === "tipos" });

  const { 
    users = [], 
    isLoading: loadingUsers, 
    deleteUser 
  } = useUsers({ enabled: activeTab === "usuarios" });

  // Operations mapped to layered services/hooks
  const handleVerifyReport = async (id: number) => {
    setIsVerifying(true);
    try {
      await verifyReport(id);
      toast.success(`Incidente #${id} verificado.`);
    } catch (err: any) {
      toast.error(err.message || "Error al verificar reporte");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    setIsDeletingReport(true);
    try {
      await deleteReport(id);
      toast.success("Incidente eliminado correctamente.");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar reporte");
    } finally {
      setIsDeletingReport(false);
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setIsCreatingType(true);
    try {
      await createReportType(newTypeName.trim());
      toast.success("Nuevo tipo de reporte creado.");
      setNewTypeName("");
    } catch (err: any) {
      toast.error(err.message || "Error al crear tipo de reporte");
    } finally {
      setIsCreatingType(false);
    }
  };

  const handleDeleteType = async (id: number) => {
    setIsDeletingType(true);
    try {
      await deleteReportType(id);
      toast.success("Tipo de reporte eliminado.");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar tipo");
    } finally {
      setIsDeletingType(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setIsDeletingUser(true);
    try {
      await deleteUser(id);
      toast.success("Usuario eliminado.");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar usuario");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleRefresh = async () => {
    if (activeTab === "incidentes") await refetchReports();
    toast.success("Datos actualizados");
  };

  // KPI counts
  const totalCount = reports.length;
  const verifiedCount = reports.filter((r) => r.verified).length;
  const pendingCount = totalCount - verifiedCount;
  const uniqueZones = new Set(reports.map((r) => r.zone).filter(Boolean)).size;

  const cards = [
    { label: "Total (filtro)", value: totalCount.toString() },
    { label: "Verificados", value: verifiedCount.toString() },
    { label: "Pendientes", value: pendingCount.toString() },
    { label: "Zonas", value: uniqueZones.toString() },
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Gestión administrativa
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Panel de administración
          </h1>
          <p className="text-muted-foreground text-sm">
            Acceso Autoridad — control total de incidentes, catálogo de tipos y usuarios.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setCreateAlertOpen(true)}
            className="rounded-xl gap-2 font-bold cursor-pointer"
          >
            <PlusCircle className="size-4" />
            Nueva alerta
          </Button>
          <Button asChild variant="secondary" className="rounded-xl gap-2 border border-border cursor-pointer">
            <Link to="/admin/mapa">
              <Map className="size-4" />
              Abrir mapa
            </Link>
          </Button>
          <Button
            onClick={handleRefresh}
            variant="secondary"
            className="rounded-xl gap-2 border border-border cursor-pointer"
          >
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {activeTab === "incidentes" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-2xl p-6">
              <div className="font-display text-4xl font-bold text-primary mb-1 leading-none">
                {c.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                {c.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-4 border-b border-border">
          <button
            onClick={() => setActiveTab("incidentes")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
              activeTab === "incidentes"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-4" />
            Incidentes
          </button>
          <button
            onClick={() => setActiveTab("tipos")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
              activeTab === "tipos"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="size-4" />
            Tipos
          </button>
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
              activeTab === "usuarios"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-4" />
            Usuarios
          </button>
        </div>

        {/* Tab 1: INCIDENTES */}
        {activeTab === "incidentes" && (
          <div className="overflow-x-auto">
            {loadingReports ? (
              <div className="py-20 flex items-center justify-center text-xs text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin" />
                Cargando incidentes reales...
              </div>
            ) : reports.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground">
                Ningún reporte encontrado con los filtros actuales.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border bg-muted/20">
                    <th className="text-left px-6 py-3">ID</th>
                    <th className="text-left px-3 py-3">Tipo</th>
                    <th className="text-left px-3 py-3">Descripción</th>
                    <th className="text-left px-3 py-3">Zona</th>
                    <th className="text-left px-3 py-3">Estado</th>
                    <th className="text-left px-3 py-3">Fecha</th>
                    <th className="text-right px-6 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        #{row.id}
                      </td>
                      <td className="px-3 py-4 font-medium">{row.type?.name || "Desconocido"}</td>
                      <td className="px-3 py-4 text-muted-foreground max-w-xs truncate">{row.description}</td>
                      <td className="px-3 py-4 text-muted-foreground">{row.zone}</td>
                      <td className="px-3 py-4">
                        <StatusBadge status={row.verified ? "Verificado" : "Pendiente"} />
                      </td>
                      <td className="px-3 py-4 text-xs text-muted-foreground tabular-nums">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {!row.verified && (
                            <button
                              onClick={() => handleVerifyReport(row.id)}
                              disabled={isVerifying}
                              title="Verificar"
                              className="size-8 rounded-lg border border-border hover:border-emerald-500 hover:text-emerald-500 grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Check className="size-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReport(row.id)}
                            disabled={isDeletingReport}
                            title="Eliminar"
                            className="size-8 rounded-lg border border-border hover:border-destructive hover:text-destructive grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="px-6 py-3 text-xs text-muted-foreground border-t border-border">
              {reports.length} incidentes en vista
            </div>
          </div>
        )}

        {/* Tab 2: TIPOS */}
        {activeTab === "tipos" && (
          <div className="p-6">
            <form onSubmit={handleCreateType} className="flex gap-3 mb-6 max-w-md">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Nombre del nuevo tipo de reporte (ej: Bache)"
                required
                className="flex-1 h-10 px-3.5 rounded-xl bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <Button type="submit" disabled={isCreatingType} className="rounded-xl font-bold gap-2 cursor-pointer">
                <Plus className="size-4" />
                Añadir
              </Button>
            </form>

            <div className="border border-border rounded-xl overflow-hidden">
              {loadingTypes ? (
                <div className="py-12 flex items-center justify-center text-xs text-muted-foreground gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando catálogo...
                </div>
              ) : reportTypes.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Catálogo vacío. Añade un tipo de reporte.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border bg-muted/20">
                      <th className="text-left px-6 py-3">ID</th>
                      <th className="text-left px-3 py-3">Nombre</th>
                      <th className="text-left px-3 py-3">Peso Base</th>
                      <th className="text-right px-6 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportTypes.map((type) => (
                      <tr key={type.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">#{type.id}</td>
                        <td className="px-3 py-3 font-medium">{type.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">{type.base_weight || 1} pts</td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleDeleteType(type.id)}
                            disabled={isDeletingType}
                            className="size-8 rounded-lg border border-border hover:border-destructive hover:text-destructive inline-grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: USUARIOS */}
        {activeTab === "usuarios" && (
          <div>
            <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground max-w-md">
                Usuario <strong>normal</strong>: app móvil. Usuario{" "}
                <strong>administrativo</strong>: acceso al panel (autoridad o admin).
              </p>
              <Button
                type="button"
                onClick={() => setCreateUserOpen(true)}
                className="rounded-xl font-bold gap-2 cursor-pointer"
              >
                <Plus className="size-4" />
                Nuevo usuario
              </Button>
            </div>
          <div className="overflow-x-auto">
            {loadingUsers ? (
              <div className="py-20 flex items-center justify-center text-xs text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin" />
                Cargando lista de usuarios...
              </div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground">
                Ningún usuario registrado en el sistema.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border bg-muted/20">
                    <th className="text-left px-6 py-3">ID</th>
                    <th className="text-left px-3 py-3">Nombre Completo</th>
                    <th className="text-left px-3 py-3">Teléfono</th>
                    <th className="text-left px-3 py-3">Rol</th>
                    <th className="text-right px-6 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Sin nombre";
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground truncate max-w-[120px]">{u.id}</td>
                        <td className="px-3 py-4 font-medium">{fullName}</td>
                        <td className="px-3 py-4 font-mono text-xs">{u.phone}</td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass(u.role)}`}
                          >
                            {roleLabel(u.role?.name)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={isDeletingUser}
                            className="size-8 rounded-lg border border-border hover:border-destructive hover:text-destructive inline-grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="px-6 py-3 text-xs text-muted-foreground border-t border-border">
              {users.length} usuarios registrados en base de datos
            </div>
          </div>
          </div>
        )}
      </div>

      <CreateAlertSheet
        open={createAlertOpen}
        onOpenChange={setCreateAlertOpen}
        onCreated={() => refetchReports()}
      />

      <CreateUserSheet
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: "Verificado" | "Pendiente" }) {
  const verified = status === "Verificado";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
        verified
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
      }`}
    >
      <span className={`size-1.5 rounded-full ${verified ? "bg-emerald-400" : "bg-amber-400"}`} />
      {status}
    </span>
  );
}