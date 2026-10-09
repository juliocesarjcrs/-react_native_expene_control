import dayjs from 'dayjs';

export type PeriodPreset = 3 | 6 | 12 | 'custom';

export type DateRange = {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
};

export const DEFAULT_PRESET_MONTHS = 6;

const API_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Rango de `months` meses hacia atrás.
 * Por defecto son meses COMPLETOS (termina el mes anterior), para que el
 * promedio mensual no se subestime con el mes en curso a medias.
 */
export const getPresetRange = (months: number, includeCurrentMonth: boolean): DateRange => {
  const currentMonthStart = dayjs().startOf('month');
  const lastMonthStart = includeCurrentMonth
    ? currentMonthStart
    : currentMonthStart.subtract(1, 'month');
  const firstMonthStart = lastMonthStart.subtract(months - 1, 'month');

  return {
    startDate: firstMonthStart.format(API_DATE_FORMAT),
    endDate: lastMonthStart.endOf('month').format(API_DATE_FORMAT)
  };
};
