/**
 * Parser de comentarios de copagos médicos
 * Ubicación: src/utils/commentaryParser/copagoParser.ts
 *
 * Formato estándar:
 *   Copago {Institución} {servicio} #{N}/{Total}
 *   Copago {Institución} {servicio}
 *   Copago {servicio} #{N}/{Total}
 *
 * Ejemplos reales:
 *   "Copago Colmedica terapia física #11/20"
 *   "Copago Colmedica consulta neurología"
 *   "Copago fisiatría #1/10"
 *   "Copago Colmedica control psiquiatra #2"
 *
 * NOTA: Comentarios con múltiples copagos (dos servicios en un gasto)
 * están desincentivados — deben crearse como dos gastos separados.
 * Si el parser detecta múltiples líneas "Copago", parsea solo la primera.
 */

import {
  CopagoData,
  CopagoServiceType,
  CopagoSessionStats
} from '~/shared/types/utils/commentaryParser/copago-analysis.types';

// ─────────────────────────────────────────────
// INSTITUCIONES CONOCIDAS
// Orden importa: más específico primero
// ─────────────────────────────────────────────

const KNOWN_INSTITUTIONS = [
  'colmedica',
  'salud total',
  'sura',
  'nueva eps',
  'compensar',
  'sanitas',
  'famisanar',
  'coomeva',
  'medimas',
  'eps'
];

// ─────────────────────────────────────────────
// CLASIFICADOR DE SERVICIO
// ─────────────────────────────────────────────

const classifyService = (service: string): CopagoServiceType => {
  const s = service.toLowerCase();
  if (s.includes('físic') || s.includes('fisic')) return 'terapia_fisica';
  if (s.includes('ocupacional')) return 'terapia_ocupacional';
  if (s.includes('psiquiat')) return 'psiquiatra';
  if (s.includes('psicolog') || s.includes('sicolog')) return 'psicologia';
  if (s.includes('fisiatra') || s.includes('fisiatría') || s.includes('fisiatria'))
    return 'fisiatria';
  if (s.includes('neurocirugía') || s.includes('neurocirugia')) return 'neurocirugia';
  if (s.includes('consulta')) return 'consulta';
  if (s.includes('control')) return 'control';
  return 'otro';
};

// ─────────────────────────────────────────────
// REGEX PATTERNS
// ─────────────────────────────────────────────

const PATTERNS = {
  // Línea que empieza con "Copago" — toma solo la primera si hay varias
  copagoLine: /^copago\s+(.+)$/im,

  // Número de sesión: "#11/20", "# 11 /20", "#11", "#11-12/20"
  session: /#\s*(\d+)(?:-\d+)?\s*\/?\s*(\d+)?/
};

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de un copago médico.
 * Retorna null si el comentario no empieza con "Copago".
 */
export const parseCopagoCommentary = (
  commentary: string,
  cost: number,
  date: string
): CopagoData | null => {
  if (!commentary?.trim()) return null;

  try {
    // Tomar solo la primera línea que empiece con "Copago"
    const lineMatch = commentary.match(PATTERNS.copagoLine);
    if (!lineMatch) return null;

    let rest = lineMatch[1].trim(); // todo lo que sigue después de "Copago "

    // ── 1. Extraer número de sesión ───────────────────────────────────────
    let sessionNumber: number | undefined;
    let totalSessions: number | undefined;

    const sessionMatch = rest.match(PATTERNS.session);
    if (sessionMatch) {
      sessionNumber = parseInt(sessionMatch[1]);
      totalSessions = sessionMatch[2] ? parseInt(sessionMatch[2]) : undefined;
      // Eliminar la parte de sesión del texto para extraer servicio/institución
      rest = rest.replace(PATTERNS.session, '').trim();
    }

    // ── 2. Detectar institución al inicio ────────────────────────────────
    let institution: string | undefined;
    const restLower = rest.toLowerCase();

    for (const inst of KNOWN_INSTITUTIONS) {
      if (restLower.startsWith(inst)) {
        institution = rest.slice(0, inst.length);
        // Capitalizar primera letra
        institution = institution.charAt(0).toUpperCase() + institution.slice(1).toLowerCase();
        // Casos especiales de capitalización
        if (inst === 'nueva eps') institution = 'Nueva EPS';
        if (inst === 'salud total') institution = 'Salud Total';
        rest = rest.slice(inst.length).trim();
        break;
      }
    }

    // ── 3. Lo que queda es el servicio ────────────────────────────────────
    const service = rest.trim();
    if (!service) return null;

    return {
      cost,
      date,
      institution,
      service,
      serviceType: classifyService(service),
      sessionNumber,
      totalSessions,
      hasSessions: sessionNumber !== undefined
    };
  } catch (error) {
    console.error('Error parsing copago commentary:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// CALCULADORAS
// ─────────────────────────────────────────────

/**
 * Estadísticas de progreso por servicio con sesiones.
 * Agrupa por servicio + institución y calcula progreso.
 */
export const getSessionStats = (data: CopagoData[]): CopagoSessionStats[] => {
  const withSessions = data.filter((d) => d.hasSessions);

  // Agrupar por servicio normalizado
  const groups = new Map<string, CopagoData[]>();
  for (const item of withSessions) {
    const key = `${item.serviceType}::${item.institution ?? ''}`;
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, item]);
  }

  return Array.from(groups.entries()).map(([, items]) => {
    const sorted = [...items].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last = sorted[sorted.length - 1];

    // El total de sesiones viene del último registro que lo tenga
    const totalSessions =
      sorted.reverse().find((d) => d.totalSessions !== undefined)?.totalSessions ?? 0;

    const totalCost = items.reduce((sum, d) => sum + d.cost, 0);

    return {
      service: last.service,
      institution: last.institution,
      completedSessions: items.length,
      totalSessions,
      progressPercent: totalSessions > 0 ? Math.round((items.length / totalSessions) * 100) : 0,
      totalCost,
      avgCostPerSession: Math.round(totalCost / items.length)
    };
  });
};

/**
 * Total gastado en copagos por institución.
 */
export const getTotalByInstitution = (
  data: CopagoData[]
): Array<{ institution: string; total: number; count: number }> => {
  const map = new Map<string, { total: number; count: number }>();

  for (const item of data) {
    const key = item.institution ?? 'Sin institución';
    const existing = map.get(key) ?? { total: 0, count: 0 };
    map.set(key, { total: existing.total + item.cost, count: existing.count + 1 });
  }

  return Array.from(map.entries())
    .map(([institution, stats]) => ({ institution, ...stats }))
    .sort((a, b) => b.total - a.total);
};
