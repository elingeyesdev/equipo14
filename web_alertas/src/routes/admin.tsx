import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, createContext, useContext } from "react";
import { ShieldCheck, LogOut, Map, Users, FileText, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

import { clearSession } from "@/api/httpClient";
import { authService } from "@/services/auth.service";
import { type Session } from "@/domain/types";
import { FilterProvider } from "@/context/FilterContext";
import { AdminApiBanner } from "@/components/admin/AdminApiBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { reportTypesRepository } from "@/repositories/reportTypes.repository";
import { useQuery } from "@tanstack/react-query";
import avispateLogo from "@/assets/avispate.webp";
import { reportsSocketService } from "@/services/reportsSocket.service";
import { trackingSocketService } from "@/services/trackingSocket.service";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel · Alertas" },
      { name: "description", content: "Panel administrativo de Alertas." },
    ],
  }),
  component: AdminLayout,
});


const navItems = [
  { to: "/admin/mapa", label: "Reportes en vivo", icon: Map },
  { to: "/admin/reportes", label: "Alertas", icon: FileText },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/estaciones", label: "Estaciones", icon: Building2 },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<Session | null>(null);


  useEffect(() => {
    let cancelled = false;

    authService.restoreSession().then((session) => {
      if (cancelled) return;
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      setSessionState(session);
      reportsSocketService.connect();
      trackingSocketService.connect();
    });

    return () => {
      cancelled = true;
      reportsSocketService.disconnect();
      trackingSocketService.disconnect();
    };
  }, [navigate]);

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignored
    }
    clearSession();
    reportsSocketService.disconnect();
    trackingSocketService.disconnect();
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
    <FilterProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background text-foreground">
          <AdminSidebar session={sessionState} onLogout={logout} />
          <main className="flex-1 min-w-0 px-6 lg:px-10 py-8">
            <AdminBackendStatus />
            <div className="">
              <div className="min-w-0">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </FilterProvider>
  );
}

function AdminBackendStatus() {
  const healthQuery = useQuery({
    queryKey: ["admin-api-health"],
    queryFn: () => reportTypesRepository.findAll(),
    retry: 1,
    staleTime: 30_000,
  });

  if (healthQuery.isLoading || healthQuery.isSuccess) return null;

  const message =
    healthQuery.error?.message?.includes("Failed to fetch") ||
    healthQuery.error?.message?.includes("NetworkError")
      ? "No se pudo conectar con el backend. Verifica que NestJS esté corriendo en el puerto 3000 y reinicia el frontend."
      : `Error al cargar datos del backend: ${healthQuery.error?.message ?? "desconocido"}. Cierra sesión y vuelve a entrar si el token expiró.`;

  return <AdminApiBanner message={message} onRetry={() => healthQuery.refetch()} />;
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
        <div className={`flex items-center px-2 py-2 min-w-0 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2.5 min-w-0 overflow-hidden">
              <img src={avispateLogo} alt="Logo de Avispáte" className="size-9 object-contain shrink-0" />
              <div className="min-w-0 flex flex-col leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="font-display font-bold text-base tracking-tight truncate">
                  Avispáte
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Admin
                </span>
              </div>
            </Link>
          )}
          <SidebarTrigger className="shrink-0 size-7 rounded-none hover:bg-sidebar-accent transition-colors" />
          {!collapsed && <ThemeToggle />}
        </div>
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
          <div className="size-9 rounded-none bg-muted grid place-items-center text-xs font-bold uppercase shrink-0">
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