/**
 * Parser de comentarios de ayuda familiar
 * Ubicación: src/utils/commentaryParser/familyAidParser.ts
 *
 * Formatos soportados:
 *   Ayuda {periodicidad} a {Persona} {Mes} #{N}
 *   Ayuda {periodicidad} a {Persona} {Mes1}-{Mes2} {Año} #{N}
 *   Saldo [de] Ayuda {periodicidad} a {Persona} {Mes1}-{Mes2} #{N}
 *   Abono Ayuda {periodicidad} a {Persona} ...
 *
 * Ejemplos reales:
 *   "Ayuda bimensual a Papá Jairo Mar-Abr 2026 #9"
 *   "Saldo de Ayuda bimensual a Papá Jairo Ene-Feb 2026 #8"
 *   "Activar cuenta Banco Agrario"  ← no matchea, retorna null
 */

import {
  FamilyAidData,
  FamilyAidPeriodicity,
  FamilyAidPaymentType
} from '~/shared/types/utils/commentaryParser/family-aid-analysis.types';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const PERIODICITIES: Record<string, FamilyAidPeriodicity> = {
  mensual: 'mensual',
  bimensual: 'bimensual',
  trimestral: 'trimestral'
};

const MONTH_ABBREVS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic'
];

/** Normaliza abreviaciones de meses con errores comunes ("Enr" → "Ene") */
const normalizeMonth = (raw: string): string => {
  const clean = raw.trim();
  const exact = MONTH_ABBREVS.find((m) => m.toLowerCase() === clean.toLowerCase());
  if (exact) return exact;

  // Correcciones frecuentes
  const corrections: Record<string, string> = {
    enr: 'Ene',
    ene: 'Ene',
    feb: 'Feb',
    mar: 'Mar',
    abr: 'Abr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    ago: 'Ago',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dic: 'Dic'
  };
  return corrections[clean.toLowerCase()] ?? clean;
};

// ─────────────────────────────────────────────
// REGEX PATTERNS
// ─────────────────────────────────────────────

const PATTERNS = {
  // "Saldo [de] Ayuda ..." o "Abono Ayuda ..."
  paymentPrefix: /^(saldo(?:\s+de)?|abono)\s+/i,

  // "Ayuda {periodicidad} a {Persona} ..."
  // Captura todo lo que viene después del "a" como persona + período
  base: /^ayuda\s+(\w+)\s+a\s+(.+)$/i,

  // "{Mes}-{Mes} {Año}" o "{Mes}-{Mes}" al final del nombre extraído
  periodRange: /([A-Za-z]{3})-([A-Za-z]{3})(?:\s+(\d{4}))?/,

  // "{Mes} {Año}" mes único
  periodSingle: /([A-Za-z]{3})(?:\s+(\d{4}))?/,

  // "#{N}" número de secuencia
  sequence: /#\s*(\d+)/
};

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de un gasto de ayuda familiar.
 * Retorna null si no sigue el patrón "Ayuda ... a ...".
 */
export const parseFamilyAidCommentary = (
  commentary: string,
  cost: number,
  date: string
): FamilyAidData | null => {
  if (!commentary?.trim()) return null;

  try {
    let normalized = commentary.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // ── 1. Detectar tipo de pago (saldo / abono / completo) ──────────────
    let paymentType: FamilyAidPaymentType = 'completo';
    const prefixMatch = normalized.match(PATTERNS.paymentPrefix);
    if (prefixMatch) {
      paymentType = prefixMatch[1].toLowerCase().startsWith('saldo') ? 'saldo' : 'abono';
      normalized = normalized.slice(prefixMatch[0].length).trim();
    }

    // ── 2. Patrón base "Ayuda {periodicidad} a {resto}" ──────────────────
    const baseMatch = normalized.match(PATTERNS.base);
    if (!baseMatch) return null;

    const periodicityRaw = baseMatch[1].toLowerCase();
    const periodicity: FamilyAidPeriodicity = PERIODICITIES[periodicityRaw] ?? 'otro';
    const rest = baseMatch[2].trim(); // "Papá Jairo Mar-Abr 2026 #9"

    // ── 3. Extraer número de secuencia (#N) ───────────────────────────────
    let sequenceNumber: number | undefined;
    const seqMatch = rest.match(PATTERNS.sequence);
    if (seqMatch) {
      sequenceNumber = parseInt(seqMatch[1]);
    }

    // ── 4. Extraer período de meses ───────────────────────────────────────
    let months: string[] = [];
    let year: number | undefined;

    const rangeMatch = rest.match(PATTERNS.periodRange);
    if (rangeMatch) {
      months = [normalizeMonth(rangeMatch[1]), normalizeMonth(rangeMatch[2])];
      if (rangeMatch[3]) year = parseInt(rangeMatch[3]);
    } else {
      // Intentar mes único (buscar en la parte final antes del #)
      const restBeforeSeq = seqMatch ? rest.slice(0, rest.indexOf(seqMatch[0])).trim() : rest;
      const words = restBeforeSeq.split(' ');
      for (const word of words.reverse()) {
        const normalized_month = normalizeMonth(word);
        if (MONTH_ABBREVS.includes(normalized_month)) {
          months = [normalized_month];
          break;
        }
        // Si es año
        if (/^\d{4}$/.test(word)) {
          year = parseInt(word);
        }
      }
    }

    // ── 5. Extraer nombre de la persona ───────────────────────────────────
    // Es todo lo que queda antes del período y el #N
    let personSection = rest;
    if (rangeMatch) {
      personSection = rest.slice(0, rest.indexOf(rangeMatch[0])).trim();
    } else if (months.length > 0) {
      const monthIdx = rest.toLowerCase().indexOf(months[0].toLowerCase());
      if (monthIdx > 0) personSection = rest.slice(0, monthIdx).trim();
    }
    // Quitar el #N si quedó en la persona
    const person = personSection.replace(PATTERNS.sequence, '').trim();

    if (!person) return null;

    return {
      cost,
      date,
      person,
      periodicity,
      paymentType,
      sequenceNumber,
      months,
      year
    };
  } catch (error) {
    console.error('Error parsing family aid commentary:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// CALCULADORAS
// ─────────────────────────────────────────────

/** Total ayudado por persona en el período */
export const getTotalByPerson = (
  data: FamilyAidData[]
): Array<{ person: string; total: number; count: number }> => {
  const map = new Map<string, { total: number; count: number }>();

  for (const item of data) {
    const existing = map.get(item.person) ?? { total: 0, count: 0 };
    map.set(item.person, {
      total: existing.total + item.cost,
      count: existing.count + 1
    });
  }

  return Array.from(map.entries())
    .map(([person, stats]) => ({ person, ...stats }))
    .sort((a, b) => b.total - a.total);
};
