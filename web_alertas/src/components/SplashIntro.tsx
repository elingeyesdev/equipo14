import { useEffect, useState } from "react";
import avispateLogo from "@/assets/avispate.webp";

const STORAGE_KEY = "alertas:splash-seen";
const DURATION = 2600;

export function SplashIntro() {
  const [showSplash, setShowSplash] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    setShowSplash(true);
    document.body.style.overflow = "hidden";

    const leaveTimer = setTimeout(() => setLeaving(true), DURATION - 700);
    const endTimer = setTimeout(() => {
      setShowSplash(false);
      document.body.style.overflow = "";
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, DURATION);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(endTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!showSplash) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] grid place-items-center bg-background overflow-hidden transition-all duration-700 ${
        leaving ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      <div className="absolute inset-0 splash-backdrop" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 65%)",
        }}
      />
      <div className="absolute inset-x-0 h-32 splash-scan pointer-events-none" />
      <div className="absolute splash-orbit" style={{ width: 280, height: 280 }}>
        <span className="absolute left-1/2 top-0 -translate-x-1/2 size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
      </div>
      <div
        className="absolute splash-orbit"
        style={{ width: 360, height: 360, animationDirection: "reverse", animationDuration: "3.2s" }}
      >
        <span className="absolute left-1/2 top-0 -translate-x-1/2 size-1 rounded-full bg-primary/70 shadow-[0_0_10px_var(--primary)]" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <div className="relative grid place-items-center">
          <span className="absolute size-28 rounded-full border border-primary/40 splash-ring" />
          <span
            className="absolute size-28 rounded-full border border-primary/30 splash-ring"
            style={{ animationDelay: "0.4s" }}
          />
          <span
            className="absolute size-28 rounded-full border border-primary/20 splash-ring"
            style={{ animationDelay: "0.8s" }}
          />
          <div className="relative size-20 rounded-2xl bg-card grid place-items-center splash-logo shadow-2xl shadow-primary/25 splash-pulse border-none">
            <img src={avispateLogo} alt="Logo de Avispáte" className="size-12 object-contain" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 splash-text">
          <span className="font-display font-bold text-4xl tracking-tight text-foreground splash-title">
            {"AVISPÁTE".split("").map((c, i) => (
              <span
                key={i}
                className="inline-block splash-letter"
                style={{ animationDelay: `${0.5 + i * 0.06}s` }}
              >
                {c}
              </span>
            ))}
          </span>
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            Inteligencia urbana
          </span>
        </div>

        <div className="mt-4 h-[2px] w-48 overflow-hidden rounded-full bg-muted relative">
          <div className="absolute inset-y-0 left-0 bg-primary splash-progress" />
        </div>
        <span
          className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/60 splash-text"
          style={{ animationDelay: "0.9s" }}
        >
          Cargando red ciudadana…
        </span>
      </div>
    </div>
  );
}
