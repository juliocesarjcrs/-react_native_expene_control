/**
 * Parser de comentarios de bienes (apartamentos, lotes)
 * Ubicación: src/utils/commentaryParser/assetParser.ts
 *
 * Gramática:  Concepto: detalle [Período] [Etiqueta]
 *
 * Ejemplos:
 *   Abono: antes de escrituras
 *   Escrituración: notariales 2,3% [Valor escritura $130.000.000]
 *   4x1000: Nubank a Bancolombia $73.000.000
 *   Administración: Mar 2026          Predial: 2026
 *   Arriendo: 15 días Mar 2026 [Parcial]
 *   Intereses: Mar 2026 [Tasa 14,5% EA] [Saldo $85.000.000]
 *   Abono capital: Mar 2026 [Saldo $70.000.000]
 */
import { normalizeMonthAbbr } from '~/utils/commentary/commentaryDate.utils';
import { AssetData, AssetPeriod } from '~/shared/types/utils/commentaryParser/asset-analysis.types';
import { ASSET_CONCEPTS, resolveAssetConcept } from './assetConcepts';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const WORD = '[A-Za-zÁÉÍÓÚáéíóúÑñ]{3,10}';

/** "Marzo" | "Mar" | "Enr" → 3 ; null si no es mes */
const toMonth = (raw: string): number | null => {
  const idx = MONTHS.indexOf(normalizeMonthAbbr(raw.slice(0, 3)));
  return idx >= 0 ? idx + 1 : null;
};

/** Formato COP: puntos = miles, coma = decimales. "73.000.000" → 73000000 */
const parseCOP = (raw: string): number | null => {
  const n = Number(raw.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const buildPeriod = (
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  isAnnual = false
): AssetPeriod | null => {
  const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  return months >= 1 ? { startYear, startMonth, endYear, endMonth, months, isAnnual } : null;
};

const daysInMonth = (y: number, m: number): number => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Período dado por fechas: reparte por días entre los meses que toca. */
const buildDayPeriod = (
  y1: number,
  m1: number,
  d1: number,
  y2: number,
  m2: number,
  d2: number
): AssetPeriod | null => {
  if (d1 < 1 || d1 > daysInMonth(y1, m1) || d2 < 1 || d2 > daysInMonth(y2, m2)) return null;
  const base = buildPeriod(y1, m1, y2, m2);
  if (!base) return null;
  const days: number[] = [];
  for (let i = 0; i < base.months; i++) {
    const idx = y1 * 12 + (m1 - 1) + i;
    const y = Math.floor(idx / 12);
    const mo = (idx % 12) + 1;
    const from = i === 0 ? d1 : 1;
    const to = i === base.months - 1 ? d2 : daysInMonth(y, mo);
    days.push(to - from + 1);
  }
  if (days.some((d) => d <= 0)) return null; // la fecha final es anterior a la inicial
  const total = days.reduce((a, b) => a + b, 0);
  return { ...base, weights: days.map((d) => d / total) };
};

const findAll = (source: string, text: string): RegExpExecArray[] => {
  const re = new RegExp(source, 'g');
  const out: RegExpExecArray[] = [];
  let m = re.exec(text);
  while (m !== null) {
    out.push(m);
    m = re.exec(text);
  }
  return out;
};

/**
 * Orden de prueba: fechas con año en ambas puntas → fechas con año al final → rango cruzando
 * año → rango mismo año → mes → año.
 *   "06 Oct 2026 - 06 Oct 2027" | "15 Oct - 14 Nov 2026" | "Dic 2025 - Ene 2026" |
 *   "Mar-Abr 2026" | "Mar 2026" | "2026"
 * Con fechas se reparte por días entre los meses que toca. Si el año va una sola vez al final,
 * es el de la fecha final ("20 Dic - 19 Ene 2026").
 */
const parsePeriod = (text: string): AssetPeriod | undefined => {
  // "06 Oct 2026 - 06 Oct 2027" (p. ej. una póliza de seguro): el año va en las dos fechas
  for (const m of findAll(
    `(\\d{1,2})\\s+(${WORD})\\s+(\\d{4})\\s*[-–]\\s*(\\d{1,2})\\s+(${WORD})\\s+(\\d{4})`,
    text
  )) {
    const s = toMonth(m[2]);
    const e = toMonth(m[5]);
    if (!s || !e) continue;
    const p = buildDayPeriod(Number(m[3]), s, Number(m[1]), Number(m[6]), e, Number(m[4]));
    if (p) return p;
  }
  for (const m of findAll(
    `(\\d{1,2})\\s+(${WORD})\\s*[-–]\\s*(\\d{1,2})\\s+(${WORD})\\s+(\\d{4})`,
    text
  )) {
    const s = toMonth(m[2]);
    const e = toMonth(m[4]);
    if (!s || !e) continue;
    const y2 = Number(m[5]);
    const p = buildDayPeriod(s > e ? y2 - 1 : y2, s, Number(m[1]), y2, e, Number(m[3]));
    if (p) return p;
  }
  for (const m of findAll(`(${WORD})\\s+(\\d{4})\\s*[-–]\\s*(${WORD})\\s+(\\d{4})`, text)) {
    const s = toMonth(m[1]);
    const e = toMonth(m[3]);
    const p = s && e ? buildPeriod(Number(m[2]), s, Number(m[4]), e) : null;
    if (p) return p;
  }
  for (const m of findAll(`(${WORD})\\s*[-–]\\s*(${WORD})\\s+(\\d{4})`, text)) {
    const s = toMonth(m[1]);
    const e = toMonth(m[2]);
    const y = Number(m[3]);
    const p = s && e ? buildPeriod(y, s, y, e) : null;
    if (p) return p;
  }
  for (const m of findAll(`(${WORD})\\s+(\\d{4})`, text)) {
    const s = toMonth(m[1]);
    const y = Number(m[2]);
    const p = s ? buildPeriod(y, s, y, s) : null;
    if (p) return p;
  }
  const year = text.match(/\b(20\d{2})\b/);
  if (year) return buildPeriod(Number(year[1]), 1, Number(year[1]), 12, true) ?? undefined;
  return undefined;
};

export const parseAssetCommentary = (
  commentary: string,
  cost: number,
  date: string
): AssetData | null => {
  const text = commentary?.trim();
  if (!text) return null;

  // "Concepto: resto" — el concepto es lo que hay antes del primer ":" de la 1ª línea
  const head = text.match(/^([^:\n]{1,30}):\s*([\s\S]*)$/);
  if (!head) return null;

  const concept = resolveAssetConcept(head[1]);
  if (!concept) return null;
  const info = ASSET_CONCEPTS[concept];

  // Etiquetas [..] → se extraen y se quitan del cuerpo
  const tags: string[] = [];
  const body = head[2]
    .replace(/\[([^\]]*)\]/g, (_m, t: string) => {
      tags.push(t.trim());
      return ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();

  // [Valor escritura $320.000.000]
  const deedTag = tags.find((t) => /^valor\s+escritura/i.test(t));
  const deedMatch = deedTag?.match(/\$\s*([\d.]+(?:,\d+)?)/);
  const deedValue = deedMatch ? (parseCOP(deedMatch[1]) ?? undefined) : undefined;

  // [Saldo $85.000.000] — deuda pendiente (no confundir con el concepto "Saldo:" de compra)
  const debtTag = tags.find((t) => /^saldo\s+\$/i.test(t));
  const debtMatch = debtTag?.match(/\$\s*([\d.]+(?:,\d+)?)/);
  const debtBalance = debtMatch ? (parseCOP(debtMatch[1]) ?? undefined) : undefined;

  // [Tasa 14,5% EA]
  const rateTag = tags.find((t) => /^tasa\s+\d/i.test(t));
  const rateMatch = rateTag?.match(/^tasa\s+(\d+(?:[.,]\d+)?)\s*%\s*([A-Za-z]{1,4})?/i);
  const rate = rateMatch ? Number(rateMatch[1].replace(',', '.')) : undefined;
  const rateType = rateMatch?.[2]?.toUpperCase();

  // [Bien: Apt 1102] — exige los dos puntos para no confundir con otras etiquetas
  const propertyTag = tags.find((t) => /^bien\s*:/i.test(t));
  const property = propertyTag
    ? propertyTag.replace(/^bien\s*:\s*/i, '').trim() || undefined
    : undefined;

  const extracted = [deedTag, debtTag, rateTag, propertyTag];
  const otherTags = tags.filter((t) => t.length > 0 && !extracted.includes(t));

  const refMatch = body.match(/\$\s*([\d.]+(?:,\d+)?)/);
  const referenceAmount = refMatch ? (parseCOP(refMatch[1]) ?? undefined) : undefined;

  const pctMatch = body.match(/(\d+(?:[.,]\d+)?)\s*%/);
  const percentage = pctMatch ? Number(pctMatch[1].replace(',', '.')) : undefined;

  const daysMatch = concept === 'rentIncome' ? body.match(/(\d{1,2})\s*d[ií]as?\b/i) : null;
  const partialDays = daysMatch ? Number(daysMatch[1]) : undefined;
  const isPartial =
    concept === 'rentIncome' &&
    (partialDays !== undefined || otherTags.some((t) => /parcial/i.test(t)));

  return {
    concept,
    bucket: info.bucket,
    direction: info.direction,
    expectedNature: info.expectedNature,
    recurring: info.recurring,
    cost,
    date,
    detail: body,
    period: parsePeriod(body),
    deedValue,
    referenceAmount,
    percentage,
    property,
    debtBalance,
    rate,
    rateType,
    isPartial,
    partialDays,
    tags: otherTags
  };
};
