/**
 * Formato de textos para la pantalla de bienes.
 * Ubicación: src/utils/commentaryParser/assetFormat.utils.ts
 * (Los montos en pesos se formatean con NumberFormat de Helpers.)
 */
import { OpexBucket } from '~/shared/types/utils/commentaryParser/asset-metrics.types';

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
