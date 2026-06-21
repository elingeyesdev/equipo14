import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Siren,
  Apple,
  Play,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bell,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { SplashIntro } from "@/components/SplashIntro";
import { TiltPhone } from "@/components/TiltPhone";

import avispateLogo from "@/assets/avispate.webp";
import liveMapImg from "@/assets/live-map.png";
import inicioImg from "@/assets/inicio.jpeg";
import mapaImg from "@/assets/mapa.jpeg";
import alertasImg from "@/assets/alertas.jpeg";
import notificacionesImg from "@/assets/notificaciones.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Avispáte — Inteligencia urbana para una ciudad más segura" },
      {
        name: "description",
        content:
          "Reporta incidentes en tiempo real, visualiza el mapa en vivo y conecta con tu comunidad. La red de seguridad ciudadana más rápida.",
      },
      { property: "og:title", content: "Avispáte — Inteligencia urbana en tiempo real" },
      {
        property: "og:description",
        content:
          "Plataforma de inteligencia urbana que conecta ciudadanos, organizaciones y autoridades.",
      },
    ],
  }),
  component: Index,
});

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/* ────────────────────────── DATA ────────────────────────── */

const testimonials = [
  {
    quote:
      "Avispáte transformó la forma en que coordinamos con la comunidad. Antes tardábamos horas en saber qué pasaba. Ahora es instantáneo y verificado.",
    name: "Ing. Roberto Montero",
    role: "Director de Seguridad · Municipio SCZ",
    initials: "RM",
  },
  {
    quote:
      "Como vecina del barrio Equipetrol, esta app me da tranquilidad real. Los reportes llegan rápido y la comunidad responde. Es exactamente lo que necesitábamos.",
    name: "María Flores",
    role: "Presidenta Junta Vecinal · Vecinos Unidos",
    initials: "MF",
  },
  {
    quote:
      "Los datos que genera Avispáte son invaluables para nuestra analítica urbana. Calidad de datos superior a cualquier otra fuente que hayamos probado.",
    name: "Dr. Carlos Gutiérrez",
    role: "Investigador Urbano · TechBolivia",
    initials: "CG",
  },
];

const appScreens = [
  {
    label: "Inicio",
    description:
      "Crea reportes con foto en segundos, navega tu zona y mantente informado de alertas e incidentes cercanos.",
    img: inicioImg,
  },
  {
    label: "Mapa",
    description:
      "Visualiza zonas de riesgo, estaciones de emergencia y reportes activos con el mapa interactivo en tiempo real.",
    img: mapaImg,
  },
  {
    label: "Alertas",
    description:
      "Consulta la actividad reciente, filtra reportes por tipo y sigue el progreso de cada incidente reportado.",
    img: alertasImg,
  },
  {
    label: "Notificaciones",
    description:
      "Recibe alertas push instantáneas sobre zonas de riesgo, unidades de emergencia y monitoreo de tu ruta.",
    img: notificacionesImg,
  },
];

/* ────────────────────────── NAV ────────────────────────── */

function Nav() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Nosotros", id: "about" },
    { label: "App", id: "explore-app" },
    { label: "Testimonios", id: "testimonials" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.15)]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo a la izquierda */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img src={avispateLogo} alt="Logo de Avispáte" className="size-9 object-contain" />
          <span className="font-display font-bold text-xl tracking-tight">Avispáte</span>
        </div>

        {/* Todo alineado a la derecha: links + Probar Gratis (texto plano) + Ingresar (botón destacado) */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(l.id);
              }}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#cta-banner"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("cta-banner");
            }}
            className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Probar Gratis
          </a>
          <Button asChild className="rounded-full font-bold px-6 shadow-lg shadow-primary/20 border-none">
            <Link to="/login">Ingresar</Link>
          </Button>
        </div>

        {/* Mobile: hamburger + Ingresar */}
        <div className="flex items-center gap-3 md:hidden">
          <Button asChild size="sm" className="rounded-full font-bold px-4 border-none">
            <Link to="/login">Ingresar</Link>
          </Button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
            className="size-10 rounded-xl bg-card shadow-md grid place-items-center"
          >
            <span className="flex flex-col gap-1.5 w-5">
              <span className={`block h-0.5 bg-foreground rounded-full transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 bg-foreground rounded-full transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`block h-0.5 bg-foreground rounded-full transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96" : "max-h-0"
        } bg-background/95 backdrop-blur-xl`}
      >
        <div className="px-6 py-4 flex flex-col gap-1">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                scrollTo(l.id);
              }}
              className="py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b border-muted/20 last:border-0"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-4">
            <Button asChild className="w-full rounded-xl font-bold border-none">
              <Link to="/login">Ingresar</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ────────────────────────── HERO (centrado, estilo Sculpty) ────────────────────────── */

function Hero() {
  return (
    <section className="relative pt-36 pb-20 px-6 overflow-hidden bg-gradient-to-b from-background via-background to-muted/10">
      <div aria-hidden className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.12] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <Reveal>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6 text-foreground">
            Tu ciudad, más inteligente y segura.
          </h1>
        </Reveal>

        <Reveal delay={80}>
          <p className="text-lg md:text-xl text-muted-foreground mb-16 max-w-xl mx-auto leading-relaxed">
            Comienza tu viaje hacia una comunidad más conectada, protegida y segura con nuestra app de alertas todo en uno.
          </p>
        </Reveal>

        {/* Phone + floating cards */}
        <Reveal delay={160}>
          <div className="relative max-w-md mx-auto">
            <TiltPhone />

            {/* Floating card: top-left — Alert notification */}
            <div className="absolute -top-4 -left-16 sm:-left-28 bg-primary/15 backdrop-blur-sm p-3.5 rounded-2xl shadow-xl animate-float z-10">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-primary grid place-items-center">
                  <Bell className="size-5 text-primary-foreground" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Alerta</div>
                  <div className="text-xs font-bold text-foreground">Nuevo reporte</div>
                </div>
              </div>
            </div>

            {/* Floating card: mid-left — Stats chart */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-20 sm:-left-32 bg-card/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl animate-float z-10"
              style={{ animationDelay: "-2s" }}
            >
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-muted grid place-items-center">
                  <BarChart3 className="size-4 text-foreground" />
                </div>
                <div className="flex gap-0.5 items-end h-6">
                  {[40, 65, 50, 80, 60].map((h, i) => (
                    <div key={i} className="w-1.5 rounded-full bg-primary/60" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating card: right — Metric highlight */}
            <div
              className="absolute top-1/3 -right-12 sm:-right-28 bg-primary/10 backdrop-blur-sm p-4 rounded-2xl shadow-xl animate-float z-10"
              style={{ animationDelay: "-3s" }}
            >
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-foreground">2.4M</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Protegidos</div>
              </div>
            </div>

            {/* Floating card: bottom-right — SOS pill */}
            <div
              className="absolute -bottom-2 -right-8 sm:-right-20 bg-primary p-3 px-4 rounded-full shadow-xl animate-float z-10 flex items-center gap-2"
              style={{ animationDelay: "-4s" }}
            >
              <Siren className="size-5 text-primary-foreground" />
              <span className="text-xs font-bold text-primary-foreground hidden sm:inline">SOS</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────── ABOUT (texto grande + imagen sutil desde la derecha) ────────────────────────── */

function About() {
  return (
    <section id="about" className="py-28 px-6 bg-primary text-primary-foreground overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-foreground/70 mb-6">
            Cómo Avispáte potencia tu seguridad
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight mb-16 max-w-3xl text-balance">
            Avispáte es la plataforma que conecta ciudadanos con autoridades y organizaciones para prevenir incidentes y responder en tiempo real. Reporta, coordina y protege tu barrio.
          </h2>
        </Reveal>

        {/* Media panel — image appearing subtly from the right, no overlays */}
        <Reveal delay={160}>
          <div className="relative max-w-4xl ml-auto">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-black/20 translate-x-8 sm:translate-x-16 lg:translate-x-24">
              <img
                src={liveMapImg}
                alt="Mapa en vivo de Avispáte mostrando incidentes y estaciones de emergencia"
                className="w-full aspect-video object-cover hover:scale-[1.02] transition-transform duration-700"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────── CTA BANNER ────────────────────────── */

function CTABanner() {
  return (
    <section id="cta-banner" className="py-24 px-6 bg-card relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-primary blur-3xl" />
        <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-primary blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <Reveal>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground text-balance">
            ¿Listo para transformar tu entorno?
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="text-xl text-muted-foreground mb-10 font-medium max-w-xl mx-auto">
            Descarga la aplicación ahora
          </p>
        </Reveal>
        <Reveal delay={160} className="flex flex-wrap justify-center gap-4">
          <a
            href="#download-ios"
            className="flex items-center gap-3 bg-foreground text-background px-6 py-3 rounded-2xl hover:opacity-90 transition-all shadow-xl hover:-translate-y-0.5 duration-200"
          >
            <Apple className="size-6" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-wide opacity-60">Descargar en</div>
              <div className="text-sm font-bold font-display">App Store</div>
            </div>
          </a>
          <a
            href="#download-android"
            className="flex items-center gap-3 bg-foreground text-background px-6 py-3 rounded-2xl hover:opacity-90 transition-all shadow-xl hover:-translate-y-0.5 duration-200"
          >
            <Play className="size-5 fill-current" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-wide opacity-60">Consíguelo en</div>
              <div className="text-sm font-bold font-display">Google Play</div>
            </div>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────── EXPLORE APP (screenshots reales) ────────────────────────── */

function ExploreApp() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveIndex((p) => (p + 1) % appScreens.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="explore-app" className="py-28 px-6 bg-muted/10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">
              Experiencia del usuario
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
              Explora la aplicación
            </h2>
            <p className="text-muted-foreground text-lg">
              Descubre las pantallas clave de Avispáte: reporta incidentes, visualiza riesgos en el mapa, consulta la actividad y recibe notificaciones en tiempo real.
            </p>
          </Reveal>
        </div>

        {/* Layout: tabs left + phone right */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Tabs */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="space-y-3">
              {appScreens.map((s, idx) => (
                <button
                  key={s.label}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left p-6 rounded-3xl transition-all duration-300 border-none outline-none cursor-pointer ${
                    activeIndex === idx
                      ? "bg-card shadow-xl text-foreground"
                      : "bg-transparent text-muted-foreground hover:bg-muted/20"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      activeIndex === idx ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    Pantalla {idx + 1}
                  </span>
                  <h4 className="font-display font-bold text-xl mt-1 mb-2">{s.label}</h4>
                  {activeIndex === idx && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Phone with real screenshot */}
          <div className="lg:col-span-7 flex justify-center order-1 lg:order-2">
            <Reveal className="w-full max-w-[280px] sm:max-w-xs">
              <div className="bg-neutral-950 p-2 rounded-[2.8rem] shadow-2xl ring-8 ring-neutral-800/50 aspect-[9/19.5] flex flex-col overflow-hidden">
                {/* Notch */}
                <div className="w-24 h-5 bg-black rounded-full mx-auto mb-0.5 flex items-center justify-center shrink-0 z-10">
                  <span className="size-2 rounded-full bg-neutral-800" />
                </div>
                {/* Screen — actual screenshot image */}
                <div className="flex-1 overflow-hidden rounded-[2.2rem] relative bg-neutral-900">
                  {appScreens.map((s, idx) => (
                    <img
                      key={s.label}
                      src={s.img}
                      alt={`Pantalla de ${s.label} de la app Avispáte`}
                      className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 ${
                        activeIndex === idx
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-105"
                      }`}
                    />
                  ))}
                </div>
                {/* Home indicator */}
                <div className="w-28 h-1 bg-neutral-600 rounded-full mx-auto mt-1.5 shrink-0" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── TESTIMONIALS ────────────────────────── */

function Testimonials() {
  const [idx, setIdx] = useState(0);

  return (
    <section id="testimonials" className="py-28 px-6 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">
              Testimoniales
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Descubre lo que dice nuestra comunidad
            </h2>
          </Reveal>
        </div>

        <div className="max-w-4xl mx-auto relative px-12">
          <div className="transition-all duration-500 text-center py-6">
            <p className="font-display text-xl md:text-2xl italic leading-relaxed text-foreground max-w-3xl mx-auto">
              "{testimonials[idx].quote}"
            </p>
            <div className="mt-8 flex flex-col items-center">
              <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-lg mb-3">
                {testimonials[idx].initials}
              </div>
              <h4 className="font-bold text-base text-foreground">{testimonials[idx].name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{testimonials[idx].role}</p>
            </div>
          </div>

          <button
            onClick={() => setIdx((p) => (p - 1 + testimonials.length) % testimonials.length)}
            className="absolute left-0 top-1/2 -translate-y-1/2 size-10 rounded-full bg-card hover:bg-muted text-foreground flex items-center justify-center shadow-lg transition-colors border-none cursor-pointer outline-none"
            aria-label="Anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => setIdx((p) => (p + 1) % testimonials.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 size-10 rounded-full bg-card hover:bg-muted text-foreground flex items-center justify-center shadow-lg transition-colors border-none cursor-pointer outline-none"
            aria-label="Siguiente"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`size-2.5 rounded-full transition-all border-none outline-none cursor-pointer ${
                  idx === i ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── FOOTER ────────────────────────── */

function Footer() {
  return (
    <footer className="py-20 px-6 bg-muted/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <img src={avispateLogo} alt="Logo de Avispáte" className="size-9 object-contain" />
              <span className="font-display font-bold text-xl tracking-tight">Avispáte</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nuestra misión es empoderar al ciudadano con transparencia, tecnología y colaboración para proteger tu comunidad.
            </p>
          </div>
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider mb-5 text-foreground">Dirección</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">
              500 Terry Francine Street,<br />
              San Francisco, CA 94158
            </p>
          </div>
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider mb-5 text-foreground">Redes Sociales</h5>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">YouTube</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">TikTok</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider mb-5 text-foreground">Legal</h5>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Términos y Condiciones</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-muted/20 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-medium">
          <p>© 2035 por Avispáte. Potenciado y asegurado por Wix</p>
          <span className="opacity-60">Hecho con propósito para ciudades activas</span>
        </div>
      </div>
    </footer>
  );
}

/* ────────────────────────── MAIN ────────────────────────── */

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 antialiased overflow-x-hidden font-sans">
      <SplashIntro />
      <Nav />
      <main>
        <Hero />
        <About />
        <CTABanner />
        <ExploreApp />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
