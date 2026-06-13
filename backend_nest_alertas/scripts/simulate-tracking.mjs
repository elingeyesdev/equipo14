/**
 * Simula el movimiento de una autoridad siguiendo la ruta que trazó en la app.
 *
 * Flujo recomendado:
 *   1. En el móvil (cuenta autoridad): abrir incidente → TRAZAR RUTA
 *   2. En laptop: npm run simulate:tracking -- <UUID_AUTORIDAD> --wait 120
 *
 * El script lee la ruta guardada en Firebase (trackings/{uuid}) y recorre
 * esos mismos puntos hacia el incidente marcado.
 *
 * Uso:
 *   npm run simulate:tracking -- <UUID> [--wait segundos] [--dest lat lng]
 */

import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Falta firebase-service-account.json en backend_nest_alertas/');
  process.exit(1);
}

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ??
    `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
  });
  console.log(`Firebase RTDB: ${databaseURL}`);
}

const args = process.argv.slice(2);
const authorityUserId = args.find((a) => !a.startsWith('--'));
const waitIdx = args.indexOf('--wait');
const waitSeconds = waitIdx >= 0 ? Number(args[waitIdx + 1] ?? 90) : 90;
const destIdx = args.indexOf('--dest');
const destLatArg = destIdx >= 0 ? args[destIdx + 1] : null;
const destLngArg = destIdx >= 0 ? args[destIdx + 2] : null;

if (!authorityUserId) {
  console.error('Uso: npm run simulate:tracking -- <UUID> [--wait 120] [--dest -17.78 -63.19]');
  process.exit(1);
}

const INTERVAL_MS = 2500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toFiniteNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseRoutePoint(point) {
  if (!point || typeof point !== 'object') return null;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function interpolateRoute(start, end, steps = 12) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    });
  }
  return points;
}

async function loadTrackingPlan(ref) {
  const snap = await ref.once('value');
  return snap.val() ?? null;
}

async function waitForPlannedRoute(ref, maxSeconds) {
  let data = await loadTrackingPlan(ref);
  if (data?.route?.length >= 2) return data;

  console.log(
    `Esperando hasta ${maxSeconds}s a que la autoridad pulse «Trazar ruta» en el móvil…`,
  );
  console.log('(Solo hace falta TRAZAR RUTA; no necesitas Iniciar navegación)\n');

  const deadline = Date.now() + maxSeconds * 1000;
  while (Date.now() < deadline) {
    await sleep(2000);
    data = await loadTrackingPlan(ref);
    if (data?.route?.length >= 2) {
      console.log('Ruta recibida desde Firebase.\n');
      return data;
    }
  }
  return data;
}

async function run() {
  const db = admin.database();
  const ref = db.ref(`trackings/${authorityUserId}`);

  let plan = await waitForPlannedRoute(ref, waitSeconds);

  let route = (plan?.route ?? [])
    .map(parseRoutePoint)
    .filter(Boolean);

  const lastRoutePoint = route.length ? route[route.length - 1] : null;

  let incidentLat =
    toFiniteNumber(destLatArg) ??
    toFiniteNumber(plan?.incidentLatitude) ??
    (lastRoutePoint ? lastRoutePoint.lat : null);
  let incidentLng =
    toFiniteNumber(destLngArg) ??
    toFiniteNumber(plan?.incidentLongitude) ??
    (lastRoutePoint ? lastRoutePoint.lng : null);

  if (route.length < 2) {
    if (incidentLat == null || incidentLng == null) {
      console.error('\nNo hay ruta planificada en Firebase.');
      if (plan) {
        console.error('Datos actuales:', JSON.stringify({
          latitude: plan.latitude,
          longitude: plan.longitude,
          routePoints: plan.route?.length ?? 0,
          status: plan.status,
          type: plan.type,
        }, null, 2));
      }
      console.error(
        '\nPasos:\n' +
          '1) Hot restart de la app móvil (cuenta autoridad)\n' +
          '2) Abre el incidente → TRAZAR RUTA (espera la línea naranja)\n' +
          '3) Ejecuta de nuevo este comando (espera 90s automático)\n' +
          'O: npm run simulate:tracking -- <UUID> --dest <lat> <lng>',
      );
      process.exit(1);
    }

    const startLat = toFiniteNumber(plan?.latitude) ?? incidentLat + 0.006;
    const startLng = toFiniteNumber(plan?.longitude) ?? incidentLng - 0.012;
    route = interpolateRoute({ lat: startLat, lng: startLng }, { lat: incidentLat, lng: incidentLng });
    console.log(
      `Sin ruta Mapbox guardada; interpolando ${route.length} puntos hacia el incidente.`,
    );
  }

  // Destino = último punto de la ruta trazada (Mapbox termina en el incidente)
  if (lastRoutePoint) {
    incidentLat = lastRoutePoint.lat;
    incidentLng = lastRoutePoint.lng;
  }

  if (incidentLat == null || incidentLng == null) {
    console.error('No se pudo determinar el destino del incidente.');
    process.exit(1);
  }

  // Demo: recorrer como mucho 24 puntos (~1 min) aunque Mapbox devolvió cientos
  const MAX_SIM_POINTS = 24;
  if (route.length > MAX_SIM_POINTS) {
    const step = (route.length - 1) / (MAX_SIM_POINTS - 1);
    route = Array.from({ length: MAX_SIM_POINTS }, (_, i) => {
      const idx = Math.min(route.length - 1, Math.round(i * step));
      return route[idx];
    });
    incidentLat = route[route.length - 1].lat;
    incidentLng = route[route.length - 1].lng;
    console.log(`Ruta simplificada a ${route.length} puntos para la demo.`);
  }

  const type = plan?.type || 'Unidad de respuesta';
  const description = plan?.description || 'Simulación en ruta al incidente';
  const reportId = plan?.reportId ?? null;

  console.log(`Simulando tracking para autoridad: ${authorityUserId}`);
  console.log(`Incidente destino: lat=${incidentLat}, lng=${incidentLng}`);
  if (reportId != null) console.log(`Reporte #${reportId}`);
  console.log(`Puntos de ruta: ${route.length} · intervalo: ${INTERVAL_MS}ms`);
  console.log('Ctrl+C para detener y borrar tracking.\n');

  const cleanup = async () => {
    await ref.remove();
    console.log('\nTracking eliminado de Firebase.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  for (let i = 0; i < route.length; i++) {
    const point = route[i];
    const slice = route.slice(i);

    await ref.set({
      latitude: point.lat,
      longitude: point.lng,
      incidentLatitude: incidentLat,
      incidentLongitude: incidentLng,
      ...(reportId != null ? { reportId } : {}),
      type,
      description,
      route: slice,
      status: 'simulated',
      timestamp: admin.database.ServerValue.TIMESTAMP,
    });

    console.log(`  [${i + 1}/${route.length}] lat=${point.lat.toFixed(5)}, lng=${point.lng.toFixed(5)}`);
    if (i < route.length - 1) {
      await sleep(INTERVAL_MS);
    }
  }

  console.log('\nLlegó al incidente. Tracking activo 30 s más…');
  await sleep(30_000);
  await cleanup();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
