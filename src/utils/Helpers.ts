import 'intl';
import 'intl/locale-data/jsonp/en';
import { colorPalette } from './colorPalette';

import dayjs, { Dayjs } from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import 'dayjs/locale/es';
import { DayMonthResult } from '~/shared/types/utils/helpers.type';
import { LastIncomes } from '~/shared/types/services/income-service.type';

dayjs.extend(isLeapYear); //  TypeError: Object is not a function, js engine: hermes
dayjs.locale('es');

/**
 * Formatea un número con separadores de miles para mostrar en inputs
 * Ejemplo: 40000 → "40.000"
 */
export const formatNumberInput = (value: number | string): string => {
  if (!value) return '';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';

  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(numValue);
};

/**
 * Parsea un string formateado a número
 * Ejemplo: "40.000" → 40000
 */
export const parseFormattedNumber = (text: string): number => {
  if (!text) return 0;

  // Remueve todos los puntos de separación de miles
  const cleaned = text.replace(/\./g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? 0 : parsed;
};
export const NumberFormat = (value: number | string): string => {
  const num = typeof value === 'string' ? Number(value) : value;

  // Opcional: validar por si el string no es número
  if (isNaN(num)) {
    console.warn('NumberFormat recibió un valor no numérico:', value);
    return '$ 0';
  }

  const formatted = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0
  }).format(num);

  return `$ ${formatted}`;
};

export const DateFormat = (date: string | Date, format = 'DD MMM hh:mm a') => {
  return dayjs(date).format(format);
};

export const AsignColor = (index: number) => {
  const leng = colorPalette.length;
  if (index < leng) {
    return colorPalette[index];
  }
  return '#AEA3CD';
};
export const delay = (miliseconst = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, miliseconst);
  });
};
export const compareValues = <T extends Record<string, any>>(
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
) => {
  return function innerSort(a: T, b: T): number {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      return 0;
    }

    const varA = typeof a[key] === 'string' ? (a[key] as string).toUpperCase() : a[key];
    const varB = typeof b[key] === 'string' ? (b[key] as string).toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) comparison = 1;
    else if (varA < varB) comparison = -1;

    return order === 'desc' ? comparison * -1 : comparison;
  };
};

export const GetInitialMonth = (
  date: string | number | Date | Dayjs,
  offset: number = 0
): number => {
  return dayjs().diff(dayjs(date), 'months') + offset;
};

export const cutText = (text: string, n = 12): string => {
  if (text.length > n) {
    return text.slice(0, n) + '...';
  } else {
    return text;
  }
};

export const dayMonth = (offset = 0): DayMonthResult => {
  const today = dayjs().date();
  const daysInMonth = dayjs().daysInMonth();
  let percentage = '';
  const numPercentage = percent(daysInMonth, today);

  if (offset > 0) {
    const temp = numPercentage + offset;
    percentage = `${temp.toFixed(2)}%`;
  } else {
    percentage = `${numPercentage.toFixed(2)}%`;
  }

  return {
    day: today,
    daysInMonth,
    percentage,
    withOffset: offset > 0,
    numPercentage: numPercentage
  };
};

const percent = (total: number, cant: number) => {
  return total > 0 ? (cant * 100) / total : 0;
};

export const getDateStartOfMonth = (date: string) => {
  return dayjs(date).startOf('month').format('YYYY-MM-DD');
};

export const handlerDataSearch = (
  newData: LastIncomes[],
  dataOldArray: LastIncomes[],
  query: null | string,
  prevQuery: string | null | undefined,
  page: number
) => {
  let concatPages = [];
  const condition1 = query === null && prevQuery === undefined;
  const condition2 = query === null && prevQuery === null;
  const condition3 = query === '' && prevQuery === '';
  if (condition1 || condition2) {
    concatPages = dataOldArray.concat(newData);
    concatPages = getUniqArrDeep(concatPages);
  } else {
    if (condition3) {
      concatPages = dataOldArray.concat(newData);
      concatPages = getUniqArrDeep(concatPages);
    } else {
      if (page > 1) {
        concatPages = dataOldArray.concat(newData);
        concatPages = getUniqArrDeep(concatPages);
      } else {
        concatPages = newData;
      }
    }
  }
  return concatPages;
};

const getUniqArrDeep = (arr: LastIncomes[]) => {
  const arrStr = arr.map((item) => JSON.stringify(item));
  return [...new Set(arrStr)].map((item) => JSON.parse(item));
};

export const filterLimitDataForGraph = <T>(data: T[], numMonthsGraph: number): T[] => {
  const len = data.length;
  return data.slice(len - numMonthsGraph, len);
};

export const calculateAverage = (data: number[]) => {
  const sum = data.reduce((acu, val) => {
    return acu + val;
  }, 0);
  return data.length > 0 ? sum / data.length : 0;
};
