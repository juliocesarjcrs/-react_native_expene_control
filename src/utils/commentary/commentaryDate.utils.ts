import dayjs from 'dayjs';

/**
 * Helpers de fecha compartidos por los templates y los parsers.
 * Extraídos de commentaryTemplates.utils.ts para evitar dependencias circulares
 * (assetTemplates.utils.ts y assetParser.ts los necesitan y templates.utils
 * importa assetTemplates.utils).
 *
 * dayjs ya está configurado con locale 'es' en Helpers.ts — no se vuelve a llamar
 * dayjs.locale() aquí para no duplicar efectos secundarios.
 */

/**
 * Normaliza abreviaciones de mes al estándar del parser.
 * Corrige typos reales encontrados en BD: "Enr" → "Ene", etc.
 */
export const normalizeMonthAbbr = (raw: string): string => {
  const map: Record<string, string> = {
    enr: 'Ene',
    ene: 'Ene',
    jan: 'Ene',
    feb: 'Feb',
    mar: 'Mar',
    abr: 'Abr',
    apr: 'Abr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    ago: 'Ago',
    aug: 'Ago',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dic: 'Dic',
    dec: 'Dic'
  };
  return map[raw.toLowerCase().trim()] ?? raw;
};

/** Formatea una fecha como "18 Dic". */
export const formatDateShort = (date: Date): string => {
  const d = dayjs(date);
  const month = normalizeMonthAbbr(d.format('MMM'));
  return `${d.date()} ${month}`;
};

/** Formatea una fecha como "18 Dic 2026". */
export const formatDateWithYear = (date: Date): string => {
  const d = dayjs(date);
  const month = normalizeMonthAbbr(d.format('MMM'));
  return `${d.date()} ${month} ${d.year()}`;
};
