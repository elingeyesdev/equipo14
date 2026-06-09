import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Siren,
  MapPin,
  TrafficCone,
  Users,
  HeartPulse,
  BrainCircuit,
  Apple,
  Play,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import liveMap from "@/assets/live-map.jpg";
import { Reveal } from "@/components/Reveal";
import { SplashIntro } from "@/components/SplashIntro";
import { TiltPhone } from "@/components/TiltPhone";
import { CountUp } from "@/components/CountUp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alertas — Inteligencia urbana para una ciudad más segura" },
      {
        name: "description",
        content:
          "Reporta incidentes en tiempo real, visualiza el mapa en vivo y conecta con autoridades. La red de seguridad ciudadana más rápida.",
      },
      { property: "og:title", content: "Alertas — Inteligencia urbana en tiempo real" },
      {
        property: "og:description",
        content:
          "Plataforma de inteligencia urbana que conecta ciudadanos, organizaciones y autoridades.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Siren,
    title: "Alertas SOS",
    description:
      "Botón de pánico con geolocalización instantánea compartida con contactos y autoridades.",
  },
  {
    icon: MapPin,
    title: "Mapa en Vivo",
    description:
      "Visualiza incidentes, obras y zonas de riesgo en tiempo real con capas de inteligencia.",
  },
  {
    icon: TrafficCone,
    title: "Reporte Vial",
    description:
      "Informa sobre baches, semáforos dañados o bloqueos para mejorar la movilidad urbana.",
  },
  {
    icon: Users,
    title: "Seguridad Vecinal",
    description:
      "Crea grupos privados con tus vecinos para vigilar tu calle y recibir alertas locales.",
  },
  {
    icon: HeartPulse,
    title: "Emergencias Médicas",
    description:
      "Acceso rápido a servicios de ambulancia y hospitales con tu historial clínico digital.",
  },
  {
    icon: BrainCircuit,
    title: "Central de IA",
    description:
      "Detección automática de patrones de riesgo mediante algoritmos de inteligencia urbana.",
  },
];

const stats = [
  { value: "+500k", label: "Reportes activos" },
  { value: "14 min", label: "Respuesta promedio" },
  { value: "2.4M", label: "Ciudadanos protegidos" },
  { value: "98%", label: "Veracidad de datos" },
];

const steps = [
  {
    n: "01",
    title: "Reporta",
    description: "Captura una foto o describe el incidente en segundos.",
  },
  {
    n: "02",
    title: "Verifica",
    description: "La comunidad y la IA validan la autenticidad del reporte.",
  },
  {
    n: "03",
    title: "Notifica",
    description: "Alertamos a las autoridades y a los usuarios en el área.",
  },
  {
    n: "04",
    title: "Resuelve",
    description: "Seguimiento en vivo hasta que el problema queda solucionado.",
  },
];

const testimonials = [
  {
    initials: "RM",
    name: "Ing. Roberto Montero",
    role: "Director de Seguridad · Municipio SCZ",
    quote:
      "Alertas transformó la forma en que coordinamos con la comunidad. Antes tardábamos horas en saber qué pasaba. Ahora es instantáneo y verificado.",
  },
  {
    initials: "MF",
    name: "María Flores",
    role: "Presidenta Junta Vecinal · Vecinos Unidos",
    quote:
      "Como vecina del barrio Equipetrol, esta app me da tranquilidad real. Los reportes llegan rápido y la comunidad responde. Es exactamente lo que necesitábamos.",
  },
  {
    initials: "CG",
    name: "Dr. Carlos Gutiérrez",
    role: "Investigador Urbano · TechBolivia",
    quote:
      "Los datos que genera Alertas son invaluables para nuestra analítica urbana. Calidad de datos superior a cualquier otra fuente que hayamos probado.",
  },
];

const faqs = [
  {
    q: "¿Alertas es completamente gratuito?",
    a: "Sí. La aplicación es gratuita para todos los ciudadanos. Puedes reportar, ver el mapa y recibir notificaciones sin ningún costo. Las funciones avanzadas para organizaciones y municipios tienen planes especiales.",
  },
  {
    q: "¿Cómo se verifica que un reporte sea verdadero?",
    a: "Combinamos validación por la comunidad (otros usuarios cercanos confirman o desmienten) con un algoritmo de Proof-of-Location y análisis de patrones para filtrar reportes falsos.",
  },
  {
    q: "¿Mis datos personales están seguros?",
    a: "Sí. Usamos cifrado de extremo a extremo y enmascaramiento de identidad. Tus datos personales nunca se comparten con terceros sin tu autorización explícita.",
  },
  {
    q: "¿En qué ciudades está disponible?",
    a: "Actualmente operamos en 12 ciudades de Latinoamérica y seguimos expandiéndonos cada mes. Consulta el mapa de cobertura dentro de la app.",
  },
  {
    q: "¿Puedo reportar incidentes sin conexión?",
    a: "Sí. La app cuenta con modo offline que permite enviar reportes vía SMS encriptado cuando recuperes señal o haya falla de datos.",
  },
  {
    q: "¿Cómo se integra con autoridades y municipios?",
    a: "Tenemos un panel administrativo dedicado para autoridades certificadas, con APIs, paneles de control y reportería exportable para coordinar respuestas.",
  },
  {
    q: "¿Qué categorías de alertas soporta la app?",
    a: "Robos, accidentes viales, emergencias médicas, tráfico, incendios, problemas de infraestructura urbana y más. La taxonomía se actualiza con la comunidad.",
  },
];

const trustedBy = [
  "MUNICIPIO SCZ",
  "CRUZ ROJA",
  "POLICÍA NACIONAL",
  "VECINOS UNIDOS",
  "TECHBOLIVIA",
  "ONG CIUDADVIVA",
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative size-9 rounded-lg bg-primary grid place-items-center">
        <ShieldCheck className="size-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="font-display font-bold text-xl tracking-tight">ALERTAS</span>
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const links = [
    { label: "Funciones", id: "funciones" },
    { label: "Impacto", id: "impacto" },
    { label: "Mapa", id: "mapa" },
    { label: "Soporte", id: "faq" },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Logo />

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-muted-foreground">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => handleNav(e, l.id)}
              className="hover:text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center">
          <Button asChild className="rounded-full font-bold px-6">
            <Link to="/login">Ingresar</Link>
          </Button>
        </div>

        {/* Mobile: hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          className="md:hidden size-10 rounded-lg border border-border bg-card grid place-items-center hover:bg-muted transition-colors"
        >
          <span className="flex flex-col gap-1.5 w-5">
            <span
              className={`block h-0.5 bg-foreground rounded-full transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block h-0.5 bg-foreground rounded-full transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`}
            />
            <span
              className={`block h-0.5 bg-foreground rounded-full transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96 border-t border-border" : "max-h-0"
        } bg-background/95 backdrop-blur-xl`}
      >
        <div className="px-6 py-4 flex flex-col gap-1">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => handleNav(e, l.id)}
              className="py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b border-border last:border-0"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-4">
            <Button asChild className="w-full rounded-xl font-bold">
              <Link to="/login">Ingresar</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-40 pb-24 px-6 overflow-hidden">
      {/* Floating gradient blobs */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 -left-32 size-[420px] rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div
          className="absolute top-40 right-0 size-[360px] rounded-full bg-primary/10 blur-3xl animate-blob"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 size-[300px] rounded-full bg-primary/15 blur-3xl animate-blob"
          style={{ animationDelay: "-9s" }}
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 70%)",
        }}
      />
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <Reveal className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs font-bold tracking-widest uppercase mb-8">
            <span className="relative size-1.5 rounded-full bg-primary pulse-dot" />
            En vivo en 12 ciudades
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-8 text-balance">
              Tu ciudad, más <span className="shimmer-text">inteligente</span> y segura.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
              Reporta incidentes en tiempo real, conecta con autoridades y mantén a tu
              comunidad a salvo con inteligencia colectiva.
            </p>
          </Reveal>
          <Reveal delay={240} className="flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl h-14 px-6 font-bold text-base gap-3">
              <Apple className="size-5" />
              App Store
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-xl h-14 px-6 font-bold text-base gap-3 border border-border"
            >
              <Play className="size-5" />
              Google Play
            </Button>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative">
          <TiltPhone />
        </Reveal>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section id="impacto" className="py-16 border-y border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 80} className="text-center">
            <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-2 tracking-tight">
              <CountUp value={s.value} />
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-[0.18em] font-medium">
              {s.label}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="py-16 border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-10 font-medium">
          Con la confianza de comunidades y organizaciones
        </p>
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <div className="flex w-max gap-16 animate-marquee opacity-60">
            {[...trustedBy, ...trustedBy].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="font-display font-bold text-sm tracking-widest text-foreground/70 whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="funciones" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
            Plataforma completa
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-5 text-balance">
            Herramientas de resiliencia urbana.
          </h2>
          <p className="text-muted-foreground text-lg">
            Seis módulos diseñados con precisión para que ciudadanos, organizaciones y
            autoridades actúen más rápido.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % 3) * 80}
              className="group p-8 bg-card rounded-3xl border border-border hover:border-primary/50 hover:-translate-y-1.5 transition-all"
            >
              <div className="size-12 bg-muted rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <f.icon className="size-6 text-foreground group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {f.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveMap() {
  return (
    <section id="mapa" className="px-6 py-20">
      <div className="max-w-7xl mx-auto bg-card border border-border rounded-[2.5rem] overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="p-12 md:p-16 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
              Mapa en tiempo real
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6 text-balance">
              Visualiza el pulso de tu ciudad.
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Nuestra plataforma centraliza datos de miles de ciudadanos para ofrecerte
              una visión clara de lo que ocurre en cada esquina, actualizada al instante.
            </p>
            <ul className="space-y-4">
              {[
                "Filtros por tipo de incidencia",
                "Zonas de calor de actividad",
                "Rutas seguras recomendadas",
                "Alertas perimetrales automáticas",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="size-5 rounded-full bg-muted grid place-items-center shrink-0">
                    <Check className="size-3 text-foreground" strokeWidth={3} />
                  </span>
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative min-h-[360px] border-t lg:border-t-0 lg:border-l border-border overflow-hidden">
            <img
              src={liveMap}
              alt="Mapa en vivo con incidentes y zonas de calor"
              width={1280}
              height={1280}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur border border-border text-[10px] font-bold uppercase tracking-widest">
              <span className="size-1.5 rounded-full bg-primary" />
              248 alertas activas
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
            Cómo funciona
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-5 text-balance">
            Del reporte al impacto en minutos.
          </h2>
          <p className="text-muted-foreground text-lg">
            Cuatro pasos para que cualquier ciudadano pueda contribuir a la seguridad de
            su barrio.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 100} className="relative">
              <div className="font-display text-7xl font-bold text-muted-foreground/30 mb-4 leading-none">
                {s.n}
              </div>
              <h4 className="font-display text-xl font-bold mb-2">{s.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-32 px-6 bg-card/30 border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
            Testimonios
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Lo que dice nuestra comunidad.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 100}
              className="p-8 bg-background rounded-3xl border border-border flex flex-col"
            >
              <div className="flex gap-0.5 mb-6 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" className="size-4 fill-current">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-foreground/90 leading-relaxed mb-8 flex-1">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <div className="size-10 rounded-full bg-muted text-foreground grid place-items-center font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
            FAQ
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
            Preguntas frecuentes.
          </h2>
          <p className="text-muted-foreground">
            Todo lo que necesitas saber antes de empezar.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-display font-bold text-base md:text-lg hover:text-primary hover:no-underline py-6">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-32 px-6">
      <Reveal className="max-w-5xl mx-auto relative overflow-hidden rounded-[3rem] bg-card border border-border py-20 px-8 text-center">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, white 0%, transparent 40%)",
          }}
        />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 text-foreground tracking-tight text-balance">
            Empieza a cuidar tu ciudad hoy.
          </h2>
          <p className="text-muted-foreground mb-10 text-lg max-w-xl mx-auto">
            Descarga la app gratuita y únete a la red de seguridad ciudadana más grande
            de la región.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Button
              size="lg"
              className="rounded-xl h-14 px-6 font-bold text-base gap-3"
            >
              <Apple className="size-5" />
              Descargar para iOS
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-xl h-14 px-6 font-bold text-base gap-3 border border-border"
            >
              <Play className="size-5" />
              Descargar para Android
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            {[
              "Sin tarjeta de crédito",
              "Gratis para ciudadanos",
              "iOS & Android",
              "Privacidad garantizada",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-3.5" strokeWidth={3} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed mt-6 max-w-xs">
              Nuestra misión es empoderar al ciudadano a través de la transparencia y la
              acción inmediata.
            </p>
          </div>
          <div>
            <h5 className="text-sm font-bold mb-4 font-display">Producto</h5>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#funciones" className="hover:text-primary transition-colors">Funciones</a></li>
              <li><a href="#mapa" className="hover:text-primary transition-colors">Mapa en vivo</a></li>
              <li><a href="#impacto" className="hover:text-primary transition-colors">Impacto</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Panel Autoridades</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-sm font-bold mb-4 font-display">Compañía</h5>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Sobre nosotros</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Impacto social</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Prensa</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-sm font-bold mb-4 font-display">Legal</h5>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Términos</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Alertas. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
            <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <SplashIntro />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <TrustedBy />
        <Features />
        <LiveMap />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <div className="flex items-center justify-end gap-2 px-6 pb-4 text-[10px] text-muted-foreground/60">
        <ArrowRight className="size-3" />
        Hecho con propósito para ciudades vivas
      </div>
    </div>
  );
}
