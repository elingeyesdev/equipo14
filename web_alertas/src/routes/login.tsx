import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { ShieldCheck, ArrowRight, Lock, Phone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { getRememberLogin, setRememberLogin } from "@/lib/auth-session";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acceso · Alertas" },
      { name: "description", content: "Acceso al panel de autoridades de Alertas." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(getRememberLogin);
  const { login, isLoggingIn } = useAuth();

  useEffect(() => {
    authService.restoreSession().then((session) => {
      if (session) navigate({ to: "/admin/mapa" });
    });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRememberLogin(rememberMe);
    try {
      const session = await login({ phone, password, remember: rememberMe });
      toast.success(`Bienvenido de vuelta, ${session.user.first_name}!`);
      navigate({ to: "/admin/mapa" });
    } catch (err: any) {
      toast.error(err.message || "Credenciales incorrectas o error en el servidor");
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-2">
      {/* Lado decorativo */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 border-r border-border bg-card/40 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="size-9 rounded-lg bg-primary grid place-items-center">
            <ShieldCheck className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">ALERTAS</span>
        </Link>
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
            Panel de operaciones
          </p>
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight mb-6 text-balance">
            Coordina la respuesta de tu ciudad en tiempo real.
          </h1>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            Accede al panel de inteligencia urbana para gestionar incidentes,
            verificar reportes y exportar datos administrativos.
          </p>
        </div>
        <div className="relative flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-widest">
          <span className="size-1.5 rounded-full bg-primary" />
          12 ciudades · 2.4M ciudadanos protegidos
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-10">
            <div className="size-9 rounded-lg bg-primary grid place-items-center">
              <ShieldCheck className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">ALERTAS</span>
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Iniciar sesión
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Bienvenido de vuelta.
          </h2>
          <p className="text-muted-foreground mb-10">
            Ingresa tus credenciales de autoridad para acceder al panel.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-medium leading-relaxed">
              <strong>Acceso restringido:</strong> Este panel está destinado exclusivamente para autoridades competentes y personal de seguridad urbana.
            </div>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Teléfono
              </span>
              <div className="mt-2 relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ej: 78012345"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Contraseña
              </span>
              <div className="mt-2 relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-12 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center size-6 rounded-lg hover:bg-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <span className="text-sm text-muted-foreground">
                Mantener sesión iniciada
              </span>
            </label>

            <Button type="submit" size="lg" disabled={isLoggingIn} className="w-full rounded-xl h-12 font-bold gap-2">
              {isLoggingIn ? "Accediendo..." : "Acceder al panel"}
              {!isLoggingIn && <ArrowRight className="size-4" />}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}