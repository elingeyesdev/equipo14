import { useRef, useState, type CSSProperties } from "react";
import phoneMock from "@/assets/phone-mock.png";

export function TiltPhone() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -18, y: px * 22 });
  };

  const reset = () => {
    setActive(false);
    setTilt({ x: 0, y: 0 });
  };

  const style: CSSProperties = {
    transform: `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${active ? 1.04 : 1})`,
    transition: active ? "transform 120ms ease-out" : "transform 600ms cubic-bezier(.22,1,.36,1)",
  };

  return (
    <div
      ref={ref}
      onPointerEnter={() => setActive(true)}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className="relative w-full max-w-md mx-auto cursor-grab active:cursor-grabbing"
      style={{ perspective: "1100px" }}
    >
      <div style={style} className={active ? "" : "animate-float"}>
        <img
          src={phoneMock}
          alt="Mockup de la app Alertas mostrando el mapa de incidentes en vivo"
          width={1024}
          height={1280}
          draggable={false}
          className="w-full drop-shadow-2xl select-none pointer-events-none"
        />
      </div>
    </div>
  );
}