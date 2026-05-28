import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, createContext, useContext } from "react";
import { ShieldCheck, LogOut, Map, BarChart3, LayoutGrid, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { FiltersBar } from "@/components/admin/FiltersBar";
import { getSession, clearSession } from "@/api/httpClient";
import { authService } from "@/services/auth.service";
import { type Session } from "@/domain/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel · Alertas" },
      { name: "description", content: "Panel administrativo de Alertas." },
    ],
  }),
  component: AdminLayout,
});

import { Filters, FilterContext, useFilters } from "../context/FilterContext";

const navItems = [
  { to: "/admin/mapa", label: "Mapa en vivo", icon: Map },
  { to: "/admin/metricas", label: "Métricas", icon: BarChart3 },
  { to: "/admin/panel", label: "Panel Admin", icon: LayoutGrid },
  { to: "/admin/reportes", label: "Reportes", icon: FileText },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<Session | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "Todos",
    status: "Todos",
    zone: "Todas",
    from: "",
    to: "",
    typeId: "",
  });

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "Todos",
      status: "Todos",
      zone: "Todas",
      from: "",
      to: "",
      typeId: "",
    });
  };

  useEffect(() => {
    const current = getSession();
    if (!current) {
      navigate({ to: "/login" });
      return;
    }
    setSessionState(current);

    authService.validateSession()
      .then((updated) => {
        setSessionState(updated);
      })
      .catch((err) => {
        console.error("Verification error, logging out...", err);
        clearSession();
        navigate({ to: "/login" });
      });
  }, [navigate]);

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignored
    }
    clearSession();
    navigate({ to: "/login" });
  };

  if (!sessionState) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground text-sm">
        Cargando sesión…
      </div>
    );
  }

  return (
    <FilterContext.Provider value={{ filters, setFilters, clearFilters }}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background text-foreground">
          <AdminSidebar session={sessionState} onLogout={logout} />
          <main className="flex-1 min-w-0 px-6 lg:px-10 py-8">
            <div className="flex items-center gap-3 mb-6">
              <SidebarTrigger className="size-9 rounded-lg border border-border bg-card hover:bg-muted" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Panel administrativo
              </span>
            </div>
            <div className="grid lg:grid-cols-[300px_1fr] gap-8">
              <FiltersBar />
              <div className="min-w-0">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </FilterContext.Provider>
  );
}

function AdminSidebar({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const firstName = session.user?.first_name || "";
  const lastName = session.user?.last_name || "";
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : session.user?.phone || "Autoridad";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-2 min-w-0">
          <div className="size-9 rounded-lg bg-primary grid place-items-center shrink-0">
            <ShieldCheck className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="font-display font-bold text-base tracking-tight truncate">
                ALERTAS
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                Admin
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Navegación</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link to={item.to} className="group/nav flex items-center gap-2 transition-colors">
                        <item.icon className="size-4 transition-transform duration-300 group-hover/nav:scale-110 group-hover/nav:text-primary" />
                        {!collapsed && (
                          <span className="animate-in fade-in slide-in-from-left-3 duration-300 ease-out">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div
          className={`flex items-center gap-3 px-2 py-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-bold uppercase shrink-0">
            {firstName.slice(0, 1)}{lastName.slice(0, 1)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-xs font-bold truncate">{fullName}</span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                {session.user?.role?.name || "Autoridad"}
              </span>
            </div>
          )}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Salir" className="group/logout">
              <LogOut className="size-4 transition-transform duration-300 group-hover/logout:-translate-x-0.5" />
              {!collapsed && (
                <span className="animate-in fade-in slide-in-from-left-3 duration-300">Salir</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}