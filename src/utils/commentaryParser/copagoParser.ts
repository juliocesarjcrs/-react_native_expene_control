/**
 * Parser de comentarios de copagos médicos
 * Ubicación: src/utils/commentaryParser/copagoParser.ts
 *
 * Formato estándar (todo lo entre [] es opcional):
 *   [Copago] [Institución] {Acto} {Área} [#N[/Total]] [@Paciente] [- nota libre]
 *
 * Ejemplos:
 *   "Colmedica Consulta Reumatología #1"
 *   "Colmedica Control Reumatología #2 - resultado resonancia"
 *   "Colmedica Terapia Física #11/20"
 *   "Salud Total Medicamentos @Julio"
 *   "Domicilio Laboratorio - Lopez Correa"
 *
 * Reglas:
 *   - El ANCLA es el acto, no la palabra "Copago". "Cuota moderadora ..." NO se acepta.
 *   - #N es el número de cita de esa especialidad (la primera vez es #1).
 *     En terapias es el número de sesión y admite /Total.
 *   - Sin @Paciente se asume DEFAULT_PATIENT. También se reconoce el nombre suelto
 *     (Julio, Silvia) para datos históricos.
 *   - Todo lo que sigue a " - " (guion con espacios) es nota y no ensucia el área.
 *   - Un comentario con varias líneas: solo se parsea la primera no vacía.
 *   - Compatibilidad: se acepta el acto al final ("Reumatología Control #1") solo
 *     si el área es una especialidad del catálogo.
 *   - Un comentario con la palabra "domicilio" y un acto distinto de Domicilio
 *     (ej. "Laboratorio sangre a domicilio") se rechaza: es ambiguo.
 */

import {
  CopagoAct,
  CopagoData,
  CopagoMonthlySpending,
  CopagoPendingCycle,
  CopagoPendingSummary,
  CopagoSeriesStats
} from '~/shared/types/utils/commentaryParser/copago-analysis.types';
import {
  ACT_GROUPS,
  ACT_WORDS,
  ACTS_REQUIRING_AREA,
  ACTS_THAT_CONFLICT_WITH_HOME,
  capitalizeFirst,
  DEFAULT_PATIENT,
  IMPLIED_ACT_WORDS,
  INSTITUTIONS,
  KNOWN_PATIENTS,
  matchSpecialty,
  normalizeText,
  slugify,
  SPECIALTY_ACTS
} from './copagoCatalog';

// ─────────────────────────────────────────────
// PATRONES
// ─────────────────────────────────────────────

const PATTERNS = {
  /** "@Julio" */
  mention: /@([A-Za-zÀ-ÿ]+)/,

  /** Nombre suelto, con o sin paréntesis: "Julio", "(Julio)" */
  barePatient: new RegExp(`\\(?\\b(${KNOWN_PATIENTS.join('|')})\\b\\)?`, 'i'),

  /** Guion con espacios a ambos lados: separa la nota. "#18-19" NO lo activa */
  noteSeparator: /\s[-–—]\s/,

  /**
   * "#11/20", "# 11 /20", "#11", "#18-19/20".
   * El total exige "/" — con "/" opcional, "#4 2026" leía 2026 como total.
   */
  session: /#\s*(\d+)(?:\s*-\s*\d+)?(?:\s*\/\s*(\d+))?/
};

const INSTITUTIONS_LONGEST_FIRST = [...INSTITUTIONS]
  .map((i) => ({ ...i, words: i.phrase.split(' ') }))
  .sort((a, b) => b.words.length - a.words.length);

const capitalizeName = (name: string): string =>
  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de un copago médico.
 * Retorna null si no hay un acto reconocible (ver reglas arriba).
 */
export const parseCopagoCommentary = (
  commentary: string,
  cost: number,
  date: string
): CopagoData | null => {
  if (!commentary?.trim()) return null;

  try {
    // Solo la primera línea con contenido
    const line = commentary
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    if (!line) return null;

    let text = line;

    // ── 1. Paciente explícito (@Julio) ────────────────────────────────────
    let patient: string | undefined;
    let patientIsExplicit = false;

    const mention = text.match(PATTERNS.mention);
    if (mention) {
      patient = capitalizeName(mention[1]);
      patientIsExplicit = true;
      text = text.replace(mention[0], ' ');
    }

    // ── 2. Nota libre (después de " - ") ─────────────────────────────────
    const [bodyRaw, ...noteParts] = text.split(PATTERNS.noteSeparator);
    const note = noteParts.join(' - ').trim() || undefined;
    let body = bodyRaw;

    // ── 3. Paciente por nombre suelto (datos históricos) ─────────────────
    if (!patient) {
      const bare = body.match(PATTERNS.barePatient);
      if (bare) {
        patient = capitalizeName(bare[1]);
        patientIsExplicit = true;
        body = body.replace(bare[0], ' ');
      }
    }

    // ── 4. Número de sesión / cita ───────────────────────────────────────
    let sequenceNumber: number | undefined;
    let totalSessions: number | undefined;

    const sessionMatch = body.match(PATTERNS.session);
    if (sessionMatch) {
      sequenceNumber = parseInt(sessionMatch[1], 10);
      totalSessions = sessionMatch[2] ? parseInt(sessionMatch[2], 10) : undefined;
      body = body.replace(PATTERNS.session, ' ');
    }

    // ── 5. Tokens: quitar "Copago" e institución ────────────────────────
    let tokens = body.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean);

    if (tokens.length > 0 && normalizeText(tokens[0]) === 'copago') tokens = tokens.slice(1);

    let institution: string | undefined;
    for (const inst of INSTITUTIONS_LONGEST_FIRST) {
      const head = tokens.slice(0, inst.words.length).map(normalizeText).join(' ');
      if (head === inst.phrase) {
        institution = inst.label;
        tokens = tokens.slice(inst.words.length);
        break;
      }
    }

    if (tokens.length === 0) return null;

    // ── 6. Acto y área ────────────────────────────────────────────────────
    const norm = tokens.map(normalizeText);
    let act: CopagoAct;
    let areaTokens: string[];

    if (ACT_WORDS[norm[0]]) {
      act = ACT_WORDS[norm[0]];
      areaTokens = tokens.slice(1);
    } else if (IMPLIED_ACT_WORDS[norm[0]]) {
      act = IMPLIED_ACT_WORDS[norm[0]];
      areaTokens = tokens; // "Hidroterapia" es acto y área a la vez
    } else if (norm.length > 1 && ACT_WORDS[norm[norm.length - 1]]) {
      // Compatibilidad con "Reumatología Control": solo si el área es conocida
      const candidateAct = ACT_WORDS[norm[norm.length - 1]];
      const candidateArea = tokens.slice(0, -1).join(' ');
      if (!SPECIALTY_ACTS.includes(candidateAct) || !matchSpecialty(candidateArea)) return null;
      act = candidateAct;
      areaTokens = tokens.slice(0, -1);
    } else {
      return null;
    }

    if (ACTS_THAT_CONFLICT_WITH_HOME.includes(act) && norm.includes('domicilio')) return null;

    const area = areaTokens.join(' ').trim() || undefined;
    if (!area && ACTS_REQUIRING_AREA.includes(act)) return null;

    // ── 7. Especialidad y grupo ───────────────────────────────────────────
    let specialtyKey: string | undefined;
    let specialtyLabel: string | undefined;
    let isKnownSpecialty: boolean | undefined;

    if (area && SPECIALTY_ACTS.includes(act)) {
      const known = matchSpecialty(area);
      if (known) {
        specialtyKey = known.key;
        specialtyLabel = known.label;
        isKnownSpecialty = true;
      } else {
        specialtyKey = slugify(area);
        specialtyLabel = capitalizeFirst(area);
        isKnownSpecialty = false;
      }
    }

    const actGroup = ACT_GROUPS[act];
    const groupKey = specialtyKey ?? actGroup?.key ?? act;
    const groupLabel = specialtyLabel ?? actGroup?.label ?? capitalizeFirst(act);

    return {
      cost,
      date,
      institution,
      patient: patient ?? DEFAULT_PATIENT,
      patientIsExplicit,
      act,
      area,
      specialtyKey,
      specialtyLabel,
      isKnownSpecialty,
      groupKey,
      groupLabel,
      sequenceNumber,
      totalSessions,
      hasSequence: sequenceNumber !== undefined,
      sequenceKind:
        sequenceNumber === undefined ? undefined : act === 'terapia' ? 'session' : 'visit',
      note
    };
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// CALCULADORAS
// ─────────────────────────────────────────────

const byDateThenNumber = (a: CopagoData, b: CopagoData): number =>
  new Date(a.date).getTime() - new Date(b.date).getTime() ||
  (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0);

const buildSeriesStats = (
  items: CopagoData[],
  episode: number,
  totalEpisodes: number
): CopagoSeriesStats => {
  const numbers = items.map((i) => i.sequenceNumber as number);
  const lastNumber = Math.max(...numbers);
  const firstNumber = Math.min(...numbers);
  const present = new Set(numbers);

  const missingNumbers: number[] = [];
  for (let n = firstNumber; n <= lastNumber; n++) if (!present.has(n)) missingNumbers.push(n);

  const totalSessions = [...items]
    .reverse()
    .find((i) => i.totalSessions !== undefined)?.totalSessions;

  const acts: Partial<Record<CopagoAct, number>> = {};
  for (const i of items) acts[i.act] = (acts[i.act] ?? 0) + 1;

  const totalCost = items.reduce((sum, i) => sum + i.cost, 0);
  const last = items[items.length - 1];

  return {
    patient: last.patient,
    specialtyKey: last.specialtyKey as string,
    specialtyLabel: last.specialtyLabel as string,
    institution: [...items].reverse().find((i) => i.institution)?.institution,
    sequenceKind: items.some((i) => i.act === 'terapia') ? 'session' : 'visit',
    episode,
    totalEpisodes,
    entries: items.length,
    lastNumber,
    totalSessions,
    progressPercent: totalSessions
      ? Math.min(100, Math.round((lastNumber / totalSessions) * 100))
      : undefined,
    isClosed: totalSessions !== undefined && lastNumber >= totalSessions,
    missingNumbers,
    acts,
    totalCost,
    avgCost: Math.round(totalCost / items.length),
    lastCost: last.cost,
    firstDate: items[0].date,
    lastDate: last.date
  };
};

/**
 * Series numeradas por paciente + especialidad, separadas en ciclos.
 *
 * Un ciclo nuevo empieza cuando:
 *   - aparece #1 y el ciclo ya tenía registros,
 *   - cambia el total (#20/20 y luego #1/10, o #8/10 y luego #3/12), o
 *   - el número retrocede.
 * Un total ausente (psicología abierta) nunca parte un ciclo.
 */
export const getSeriesStats = (data: CopagoData[]): CopagoSeriesStats[] => {
  const groups = new Map<string, CopagoData[]>();
  for (const item of data) {
    if (!item.hasSequence || !item.specialtyKey) continue;
    const key = `${item.patient}::${item.specialtyKey}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const result: CopagoSeriesStats[] = [];

  groups.forEach((items) => {
    const sorted = [...items].sort(byDateThenNumber);
    const episodes: CopagoData[][] = [];

    for (const item of sorted) {
      const current = episodes[episodes.length - 1];
      const prev = current?.[current.length - 1];

      const startsNew =
        !current ||
        item.sequenceNumber === 1 ||
        (prev.totalSessions !== undefined &&
          item.totalSessions !== undefined &&
          prev.totalSessions !== item.totalSessions) ||
        (item.sequenceNumber as number) < (prev.sequenceNumber as number);

      if (startsNew) episodes.push([item]);
      else current.push(item);
    }

    episodes.forEach((ep, idx) => result.push(buildSeriesStats(ep, idx + 1, episodes.length)));
  });

  return result.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
};

/** Total gastado en copagos por institución. */
export const getTotalByInstitution = (
  data: CopagoData[]
): { institution: string; total: number; count: number }[] => {
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

const MONTH_ABBR = [
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

/** 'YYYY-MM' desde '2026-09-28' o un ISO con hora. Lee el texto para no depender de la zona horaria. */
const toMonthKey = (date: string): string => {
  if (/^\d{4}-\d{2}/.test(date)) return date.slice(0, 7);
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key: string): string => {
  const [year, month] = key.split('-');
  return `${MONTH_ABBR[parseInt(month, 10) - 1]} ${year}`;
};

const nextMonthKey = (key: string): string => {
  const [year, month] = key.split('-').map(Number);
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
};

/**
 * Gasto por mes y paciente, en orden cronológico.
 * Rellena con ceros los meses sin gasto entre el primero y el último, para que
 * un mes sin copagos se vea como un hueco y no desaparezca.
 * Los meses de los extremos pueden estar incompletos si el rango no los cubre.
 */
export const getMonthlySpending = (data: CopagoData[]): CopagoMonthlySpending[] => {
  if (data.length === 0) return [];

  const byMonth = new Map<string, CopagoMonthlySpending>();
  for (const item of data) {
    const key = toMonthKey(item.date);
    const entry = byMonth.get(key) ?? {
      month: key,
      label: monthLabel(key),
      total: 0,
      count: 0,
      byPatient: {}
    };
    entry.total += item.cost;
    entry.count += 1;
    entry.byPatient[item.patient] = (entry.byPatient[item.patient] ?? 0) + item.cost;
    byMonth.set(key, entry);
  }

  const keys = [...byMonth.keys()].sort();
  const result: CopagoMonthlySpending[] = [];
  for (let key = keys[0]; key <= keys[keys.length - 1]; key = nextMonthKey(key)) {
    result.push(
      byMonth.get(key) ?? { month: key, label: monthLabel(key), total: 0, count: 0, byPatient: {} }
    );
  }
  return result;
};

/**
 * Cuánto falta por pagar en las terapias abiertas.
 *
 * - Solo el ciclo MÁS RECIENTE de cada paciente + especialidad: un ciclo anterior
 *   sin terminar, superado por un #1 nuevo, se considera abandonado.
 * - Solo terapias (sesiones) con /Total: una consulta/control no tiene "fin",
 *   y psicología abierta no se puede proyectar (se cuenta en openWithoutTotal).
 * - Estimación = sesiones restantes × último copago pagado del ciclo.
 */
export const getPendingCycles = (series: CopagoSeriesStats[]): CopagoPendingSummary => {
  const latest = series.filter(
    (s) => s.episode === s.totalEpisodes && s.sequenceKind === 'session'
  );

  const cycles: CopagoPendingCycle[] = latest
    .filter((s) => s.totalSessions !== undefined && !s.isClosed)
    .map((s) => {
      const totalSessions = s.totalSessions as number;
      const remainingSessions = totalSessions - s.lastNumber;
      return {
        patient: s.patient,
        specialtyKey: s.specialtyKey,
        specialtyLabel: s.specialtyLabel,
        institution: s.institution,
        lastNumber: s.lastNumber,
        totalSessions,
        remainingSessions,
        lastCost: s.lastCost,
        estimatedCost: remainingSessions * s.lastCost
      };
    })
    .sort((a, b) => b.estimatedCost - a.estimatedCost);

  return {
    cycles,
    totalRemainingSessions: cycles.reduce((sum, c) => sum + c.remainingSessions, 0),
    totalEstimatedCost: cycles.reduce((sum, c) => sum + c.estimatedCost, 0),
    openWithoutTotal: latest.filter((s) => s.totalSessions === undefined).length
  };
};

/**
 * Pacientes presentes en los datos, con su cantidad de registros.
 * Mayor cantidad primero. Alimenta el selector de paciente de la pantalla.
 */
export const getPatientOptions = (data: CopagoData[]): { name: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const item of data) counts.set(item.patient, (counts.get(item.patient) ?? 0) + 1);

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};
