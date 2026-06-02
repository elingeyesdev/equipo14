/** Token público válido para desarrollo (reemplaza con el tuyo en .env) */
const DEFAULT_MAPBOX_TOKEN =
  "pk.eyJ1IjoiZWxvam9zZGVhcnJveiIsImEiOiJjbW5lbjNoZm4wMTRoMnNxM2RuZG1jdm9uIn0.nErIU6_OLUsQyg77y6geKA";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

export const SANTA_CRUZ_CENTER = {
  lng: -63.1812,
  lat: -17.7833,
} as const;

/** Tokens conocidos como revocados o inválidos (401 en API Mapbox) */
const INVALID_TOKEN_PREFIXES = ["pk.eyJ1IjoiZGF2aWRlbmNl"];

export function getMapboxToken(): string {
  const fromEnv = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  if (!fromEnv) {
    return DEFAULT_MAPBOX_TOKEN;
  }
  if (INVALID_TOKEN_PREFIXES.some((p) => fromEnv.startsWith(p))) {
    if (import.meta.env.DEV) {
      console.warn(
        "[Mapbox] VITE_MAPBOX_TOKEN no es válido (401). Usando token por defecto. " +
          "Crea un token en https://account.mapbox.com/access-tokens/",
      );
    }
    return DEFAULT_MAPBOX_TOKEN;
  }
  return fromEnv;
}

export type MapboxModule = typeof import("mapbox-gl");

/** Carga mapbox-gl una sola vez y asigna el access token */
export async function loadMapboxGl(): Promise<MapboxModule["default"]> {
  const mapboxgl = (await import("mapbox-gl")).default;
  await import("mapbox-gl/dist/mapbox-gl.css");
  mapboxgl.accessToken = getMapboxToken();
  return mapboxgl;
}

/** Tras montar el mapa en un contenedor con tamaño dinámico (sheet, grid, etc.) */
export function scheduleMapResize(map: { resize: () => void }, delayMs = 250): () => void {
  const id = window.setTimeout(() => map.resize(), delayMs);
  return () => window.clearTimeout(id);
}

/** Varios intentos tras cambios de layout (filtros, sidebar, grid) */
export function burstMapResize(map: { resize: () => void }): () => void {
  map.resize();
  const delays = [0, 50, 150, 350, 600];
  const ids = delays.map((ms) => window.setTimeout(() => map.resize(), ms));
  return () => ids.forEach((id) => window.clearTimeout(id));
}

/**
 * Mantiene el canvas de Mapbox al tamaño real del contenedor.
 * Sin esto, los tiles quedan en una franja y los bordes se ven negros.
 */
export function attachMapResizeObserver(
  map: { resize: () => void },
  container: HTMLElement,
): () => void {
  let raf = 0;
  const sync = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => map.resize());
  };

  const ro = new ResizeObserver(sync);
  ro.observe(container);

  window.addEventListener("resize", sync);
  burstMapResize(map);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("resize", sync);
  };
}
