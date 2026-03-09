/**
 * Parser de comentarios de transporte
 * Ubicación: src/utils/commentaryParser/transportParser.ts
 *
 * Formatos soportados:
 *   {Origen} a {Destino}
 *   Ida y vuelta {Origen} a {Destino}
 *   2 pasajes {Origen} a {Destino}
 *   Recarga N pasajes {descripcion}
 *
 * Ejemplos reales:
 *   "Villa Verde al Centro"
 *   "La Florida a Pereira"
 *   "Ida y vuelta al Aeropuerto Matecaña- Villa Verde"
 *   "2 pasajes Pereira - El Cedral"
 *   "Recarga 4 pasajes Megabus"
 */

import { TransportData } from '~/shared/types/utils/commentaryParser/transport-analysis.types';

// ─────────────────────────────────────────────
// REGEX PATTERNS
// ─────────────────────────────────────────────

const PATTERNS = {
  // "Ida y vuelta {Origen} a {Destino}" o "Ida y vuelta {Origen} - {Destino}"
  roundTrip: /^ida\s+y\s+vuelta\s+(.+?)\s*(?:a|-)\s*(.+)$/i,

  // "N pasajes {Origen} a {Destino}"
  multiPassenger: /^(\d+)\s+pasajes?\s+(.+?)\s*(?:a|-)\s*(.+)$/i,

  // "Recarga N pasajes {descripcion}" — tarjetas tipo Megabus
  recharge: /^recarga\s+(\d+)\s+pasajes?\s+(.+)$/i,

  // "{Origen} a {Destino}" o "{Origen} - {Destino}" — patrón base
  simple: /^(.+?)\s+a\s+(.+)$/i,
  simpleDash: /^(.+?)\s*-\s*(.+)$/i
};

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de un gasto de transporte.
 * Retorna null si el comentario no sigue ningún patrón reconocido.
 */
export const parseTransportCommentary = (
  commentary: string,
  cost: number,
  date: string
): TransportData | null => {
  if (!commentary?.trim()) return null;

  try {
    const normalized = commentary.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // ── 1. Recarga de pasajes (ej: "Recarga 4 pasajes Megabus") ───────────
    const rechargeMatch = normalized.match(PATTERNS.recharge);
    if (rechargeMatch) {
      return {
        cost,
        date,
        origin: 'Recarga',
        destination: rechargeMatch[2].trim(),
        isRoundTrip: false,
        passengerCount: parseInt(rechargeMatch[1])
      };
    }

    // ── 2. Ida y vuelta ───────────────────────────────────────────────────
    const roundTripMatch = normalized.match(PATTERNS.roundTrip);
    if (roundTripMatch) {
      return {
        cost,
        date,
        origin: roundTripMatch[1].trim(),
        destination: roundTripMatch[2].trim(),
        isRoundTrip: true,
        passengerCount: 1
      };
    }

    // ── 3. Múltiples pasajeros (ej: "2 pasajes Pereira - El Cedral") ──────
    const multiMatch = normalized.match(PATTERNS.multiPassenger);
    if (multiMatch) {
      return {
        cost,
        date,
        origin: multiMatch[2].trim(),
        destination: multiMatch[3].trim(),
        isRoundTrip: false,
        passengerCount: parseInt(multiMatch[1])
      };
    }

    // ── 4. Simple con "a" (ej: "Villa Verde al Centro") ───────────────────
    const simpleMatch = normalized.match(PATTERNS.simple);
    if (simpleMatch) {
      return {
        cost,
        date,
        origin: simpleMatch[1].trim(),
        destination: simpleMatch[2].trim(),
        isRoundTrip: false,
        passengerCount: 1
      };
    }

    // ── 5. Simple con "-" (ej: "Victoria - Villa Verde") ─────────────────
    const dashMatch = normalized.match(PATTERNS.simpleDash);
    if (dashMatch) {
      return {
        cost,
        date,
        origin: dashMatch[1].trim(),
        destination: dashMatch[2].trim(),
        isRoundTrip: false,
        passengerCount: 1
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing transport commentary:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// CALCULADORAS
// ─────────────────────────────────────────────

/** Rutas más frecuentes ordenadas por cantidad de viajes */
export const getMostFrequentRoutes = (
  data: TransportData[]
): Array<{ route: string; count: number; totalCost: number; avgCost: number }> => {
  const routeMap = new Map<string, { count: number; totalCost: number }>();

  for (const item of data) {
    const key = `${item.origin} → ${item.destination}`;
    const existing = routeMap.get(key) ?? { count: 0, totalCost: 0 };
    routeMap.set(key, {
      count: existing.count + 1,
      totalCost: existing.totalCost + item.cost
    });
  }

  return Array.from(routeMap.entries())
    .map(([route, stats]) => ({
      route,
      count: stats.count,
      totalCost: stats.totalCost,
      avgCost: Math.round(stats.totalCost / stats.count)
    }))
    .sort((a, b) => b.count - a.count);
};
