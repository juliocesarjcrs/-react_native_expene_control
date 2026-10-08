/**
 * Formato de textos para la pantalla de bienes.
 * Ubicación: src/utils/commentaryParser/assetFormat.utils.ts
 * (Los montos en pesos se formatean con NumberFormat de Helpers.)
 */
import {
  AssetMetrics,
  OpexBucket
} from '~/shared/types/utils/commentaryParser/asset-metrics.types';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** "2026-04" → "Abr 2026" */
export const formatMonth = (ym: string): string => {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  return m && Number(m[2]) >= 1 && Number(m[2]) <= 12 ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : ym;
};

/** 0.0731 → "7,3 %"  ·  null → "—" */
export const formatPercent = (value: number | null, digits = 1): string =>
  value === null ? '—' : `${(value * 100).toFixed(digits).replace('.', ',')} %`;

/** 14.96 → "14 años 11 meses"  ·  0.5 → "6 meses"  ·  null → "—" */
export const formatYears = (years: number | null): string => {
  if (years === null) return '—';
  const total = Math.round(years * 12);
  const y = Math.floor(total / 12);
  const m = total % 12;
  const yy = `${y} ${y === 1 ? 'año' : 'años'}`;
  const mm = `${m} ${m === 1 ? 'mes' : 'meses'}`;
  if (y === 0) return mm;
  return m === 0 ? yy : `${yy} ${mm}`;
};

export const OPEX_LABELS: Record<OpexBucket, string> = {
  admin: 'Administración',
  taxes: 'Predial / impuestos',
  insurance: 'Seguros',
  repairs: 'Reparaciones y mantenimiento',
  commissions: 'Comisiones',
  utilities: 'Servicios',
  other: 'Otros'
};

/**
 * Qué muestra la tarjeta de rentabilidad:
 *  - full:    hay arriendo y costo → rentabilidad, recuperación y ganancia neta
 *  - netOnly: hay arriendo pero NO costo registrado (p. ej. un bien comprado antes de usar la
 *             app) → solo ganancia neta; sin rentabilidad ni recuperación
 *  - empty:   no hay arriendo en el rango → mensaje con el motivo
 */
export type YieldCardState =
  { mode: 'full' } | { mode: 'netOnly' } | { mode: 'empty'; message: string };

export const getYieldCardState = (
  metrics: AssetMetrics,
  opts: { hasIncomeLink: boolean; incomesFailed: boolean }
): YieldCardState => {
  if (metrics.annual.rent > 0) {
    return metrics.cost.total > 0 ? { mode: 'full' } : { mode: 'netOnly' };
  }
  if (opts.incomesFailed) {
    return {
      mode: 'empty',
      message: 'No se pudieron cargar los ingresos, por eso no hay rentabilidad.'
    };
  }
  return {
    mode: 'empty',
    message: opts.hasIncomeLink
      ? 'Aún no hay arriendos registrados en el rango elegido.'
      : 'Sin arriendo vinculado: solo se muestran costo, deuda y gastos.'
  };
};
