import dayjs from 'dayjs';
import { DateFormat } from '~/utils/Helpers';

const DATE_FORMAT = 'DD MMM YYYY';

/** Porcentaje con 1 decimal y coma (estándar de la app): 10 → "10,0%" */
export const formatPercent = (value: number): string => `${value.toFixed(1).replace('.', ',')}%`;

/** Igual que formatPercent, con "+" explícito cuando es positivo: +10,0% / -5,2% */
export const formatSignedPercent = (value: number): string =>
  `${value > 0 ? '+' : ''}${formatPercent(value)}`;

/** 'YYYY-MM-DD' o ISO con hora → "15 Nov 2026". dayjs interpreta la fecha en hora local. */
export const formatApiDate = (value: string): string =>
  DateFormat(dayjs(value.slice(0, 10)).toDate(), DATE_FORMAT);

export const pluralize = (count: number, singular: string, pluralForm: string): string =>
  count === 1 ? singular : pluralForm;
