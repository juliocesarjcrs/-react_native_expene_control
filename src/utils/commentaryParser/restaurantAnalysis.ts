/**
 * Análisis de restaurantes sobre una lista de gastos
 * Ubicación: src/utils/commentaryParser/restaurantAnalysis.ts
 *
 * Une el parser y las calculadoras para que el hook de la pantalla solo tenga que
 * traer los gastos. Es lógica pura (sin React ni servicios), por eso tiene tests.
 */

import {
  RestaurantData,
  RestaurantDishHistory,
  RestaurantEventStats,
  RestaurantSimilarPair,
  RestaurantStats
} from '~/shared/types/utils/commentaryParser/restaurant-analysis.types';
import {
  getDishHistory,
  getEventStats,
  getRestaurantStats,
  getSimilarRestaurants,
  parseRestaurantCommentary
} from './restaurantParser';

/** Lo mínimo que necesita el análisis de cada gasto. */
export interface RestaurantExpenseInput {
  commentary: string | null;
  cost: number;
  date: string;
}

/** Rango analizado, como 'YYYY-MM-DD' (ver toDateKey). */
export interface DateRangeKeys {
  start: string;
  end: string;
}

/** Resumen de un mes con TODOS los registros del rango, tengan o no comentario legible. */
export interface MonthlySummary {
  /** 'YYYY-MM' */
  month: string;
  /** 'Nov 2026' */
  label: string;
  /** Registros del mes */
  visits: number;
  /** Fechas distintas con al menos un registro */
  days: number;
  total: number;
  /** total / days (0 si no hay días) */
  avgPerDay: number;
  /** El rango no cubre el mes completo: no se compara con el anterior */
  isPartial: boolean;
  /** Variación del gasto contra el mes anterior; null si alguno es parcial o el anterior fue 0 */
  changePercent: number | null;
  /** Diferencia de días contra el mes anterior; null si alguno es parcial */
  daysChange: number | null;
}

export interface RestaurantAnalysis {
  /** Gastos recibidos */
  expenseCount: number;
  /** Gastos que se leyeron como restaurante */
  records: RestaurantData[];
  /** Gastos recibidos que NO se leyeron (vacíos o con formato de producto) */
  skipped: number;
  stats: RestaurantStats[];
  dishHistory: RestaurantDishHistory[];
  similar: RestaurantSimilarPair[];
  /** Eventos gastronómicos (#NombreEvento), del más reciente al más antiguo */
  events: RestaurantEventStats[];
  eventVisits: number;
  eventCost: number;
  totalCost: number;
  viaticosVisits: number;
  viaticosCost: number;
  /** Resumen por mes de todos los gastos recibidos, del más antiguo al más reciente */
  monthly: MonthlySummary[];
}

// ─────────────────────────────────────────────
// FECHAS
// ─────────────────────────────────────────────

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

const pad = (n: number): string => String(n).padStart(2, '0');

/** Date local → 'YYYY-MM-DD'. No usa toISOString para no correr el día por la zona horaria. */
export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const monthKeyOf = (dateKey: string): string => dateKey.slice(0, 7);

const nextMonthKey = (key: string): string => {
  const [year, month] = key.split('-').map(Number);
  return month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
};

const daysInMonth = (key: string): number => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

const monthLabel = (key: string): string => {
  const [year, month] = key.split('-');
  return `${MONTH_ABBR[parseInt(month, 10) - 1]} ${year}`;
};

// ─────────────────────────────────────────────
// RESUMEN MENSUAL
// ─────────────────────────────────────────────

/**
 * Resumen por mes: días distintos, registros, gasto y variación contra el mes anterior.
 *
 * - Usa TODOS los gastos, no solo los que el parser lee: un almuerzo sin comentario
 *   sigue siendo un almuerzo comprado.
 * - Un registro no es un día: dos registros el mismo día cuentan un día.
 * - Con `range`, los meses van del primero al último del rango (los vacíos salen en cero);
 *   el primer y el último mes son parciales si el rango no los cubre completos, y un mes
 *   parcial no se compara.
 */
export const getMonthlySummary = (
  expenses: { cost: number; date: string }[],
  range?: DateRangeKeys
): MonthlySummary[] => {
  const byMonth = new Map<string, { visits: number; total: number; days: Set<string> }>();

  for (const expense of expenses) {
    const day = expense.date.slice(0, 10);
    if (!DATE_KEY.test(day)) continue;

    const key = monthKeyOf(day);
    const entry = byMonth.get(key) ?? { visits: 0, total: 0, days: new Set<string>() };
    entry.visits += 1;
    entry.total += expense.cost;
    entry.days.add(day);
    byMonth.set(key, entry);
  }

  const keys = [...byMonth.keys()];
  if (range) {
    keys.push(monthKeyOf(range.start), monthKeyOf(range.end));
  }
  if (keys.length === 0) return [];

  keys.sort();
  const first = keys[0];
  const last = keys[keys.length - 1];

  const startKey = range ? monthKeyOf(range.start) : null;
  const startDay = range ? Number(range.start.slice(8, 10)) : 1;
  const endKey = range ? monthKeyOf(range.end) : null;
  const endDay = range ? Number(range.end.slice(8, 10)) : 31;

  const result: MonthlySummary[] = [];

  for (let key = first; key <= last; key = nextMonthKey(key)) {
    const entry = byMonth.get(key);
    const visits = entry?.visits ?? 0;
    const days = entry?.days.size ?? 0;
    const total = entry?.total ?? 0;

    const isPartial =
      (key === startKey && startDay > 1) || (key === endKey && endDay < daysInMonth(key));

    const prev = result[result.length - 1];
    const comparable = prev !== undefined && !isPartial && !prev.isPartial;

    result.push({
      month: key,
      label: monthLabel(key),
      visits,
      days,
      total,
      avgPerDay: days > 0 ? Math.round(total / days) : 0,
      isPartial,
      changePercent:
        comparable && prev.total > 0
          ? Math.round(((total - prev.total) / prev.total) * 1000) / 10
          : null,
      daysChange: comparable ? days - prev.days : null
    });
  }

  return result;
};

// ─────────────────────────────────────────────
// ANÁLISIS COMPLETO
// ─────────────────────────────────────────────

export const buildRestaurantAnalysis = (
  expenses: RestaurantExpenseInput[],
  range?: DateRangeKeys
): RestaurantAnalysis => {
  const records = expenses
    .map((e) => parseRestaurantCommentary(e.commentary, e.cost, e.date))
    .filter((r): r is RestaurantData => r !== null);

  const stats = getRestaurantStats(records);
  const viaticos = records.filter((r) => r.isViaticos);
  const eventRecords = records.filter((r) => r.event);

  return {
    expenseCount: expenses.length,
    records,
    skipped: expenses.length - records.length,
    stats,
    dishHistory: getDishHistory(records),
    similar: getSimilarRestaurants(stats),
    events: getEventStats(records),
    eventVisits: eventRecords.length,
    eventCost: eventRecords.reduce((sum, r) => sum + r.cost, 0),
    totalCost: records.reduce((sum, r) => sum + r.cost, 0),
    viaticosVisits: viaticos.length,
    viaticosCost: viaticos.reduce((sum, r) => sum + r.cost, 0),
    monthly: getMonthlySummary(expenses, range)
  };
};
