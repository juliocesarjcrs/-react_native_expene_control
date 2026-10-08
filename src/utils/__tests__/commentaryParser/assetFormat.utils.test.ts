import { computeAssetMetrics } from '~/utils/commentaryParser/assetAnalytics';
import {
  getYieldCardState,
  formatMonth,
  formatPercent,
  formatYears,
  OPEX_LABELS
} from '~/utils/commentaryParser/assetFormat.utils';

describe('formatMonth', () => {
  it('"2026-04" → "Abr 2026"', () => {
    expect(formatMonth('2026-04')).toBe('Abr 2026');
    expect(formatMonth('2025-12')).toBe('Dic 2025');
  });
  it('entrada inválida se devuelve tal cual', () => {
    expect(formatMonth('2026-13')).toBe('2026-13');
    expect(formatMonth('abril')).toBe('abril');
  });
});

describe('formatPercent', () => {
  it('coma decimal y símbolo', () => {
    expect(formatPercent(0.0731)).toBe('7,3 %');
    expect(formatPercent(0.07156, 2)).toBe('7,16 %');
    expect(formatPercent(0)).toBe('0,0 %');
  });
  it('null → raya', () => expect(formatPercent(null)).toBe('—'));
});

describe('formatYears', () => {
  it('años y meses con singular/plural', () => {
    expect(formatYears(14.9)).toBe('14 años 11 meses');
    expect(formatYears(14.96)).toBe('15 años'); // redondea al mes más cercano
    expect(formatYears(1)).toBe('1 año');
    expect(formatYears(1 + 1 / 12)).toBe('1 año 1 mes');
    expect(formatYears(20)).toBe('20 años');
  });
  it('menos de un año → solo meses', () => expect(formatYears(0.5)).toBe('6 meses'));
  it('null → raya', () => expect(formatYears(null)).toBe('—'));
});

describe('OPEX_LABELS', () => {
  it('cubre todas las cubetas', () => {
    expect(Object.keys(OPEX_LABELS).sort()).toEqual([
      'admin',
      'commissions',
      'insurance',
      'other',
      'repairs',
      'taxes',
      'utilities'
    ]);
  });
});

describe('getYieldCardState — qué muestra la tarjeta de rentabilidad', () => {
  const rec = (
    id: number,
    cost: number,
    commentary: string,
    nature: 'investment' | 'operational',
    date: string
  ) => ({
    id,
    cost,
    commentary,
    nature,
    date
  });
  const COMPRA = rec(1, 100_000_000, 'Saldo: firma', 'investment', '2026-01-01');
  const ARRIENDOS = ['Jun', 'Jul', 'Ago', 'Sep'].map((m, i) =>
    rec(10 + i, 150_000, `Arriendo: ${m} 2026 [Bien: Local]`, 'investment', `2026-0${6 + i}-10`)
  );
  const ADMIN = rec(20, 60_840, 'Administración: Jul 2026', 'operational', '2026-07-20');
  const m = (expenses: ReturnType<typeof rec>[], incomes: ReturnType<typeof rec>[]) =>
    computeAssetMetrics({ expenses, incomes, asOf: '2026-10-07', propertyAliases: ['Local'] });
  const opts = { hasIncomeLink: true, incomesFailed: false };

  it('arriendo y costo → completa', () => {
    expect(getYieldCardState(m([COMPRA, ADMIN], ARRIENDOS), opts)).toEqual({ mode: 'full' });
  });

  it('arriendo SIN costo registrado (bien comprado antes de la app) → solo ganancia neta', () => {
    const metrics = m([ADMIN], ARRIENDOS);
    expect(metrics.cost.total).toBe(0);
    expect(getYieldCardState(metrics, opts)).toEqual({ mode: 'netOnly' });
    // las cifras de ganancia sí existen aunque no haya rentabilidad
    expect(metrics.annual.rent).toBeCloseTo(1_800_000);
    expect(metrics.annual.net).toBeGreaterThan(0);
    expect(metrics.yields.gross).toBeNull();
    expect(metrics.payback.years).toBeNull();
  });

  it('sin arriendo en el rango → mensaje según el motivo (ya no dice "no hay arriendos" si los hay)', () => {
    const sinArriendo = m([COMPRA], []);
    expect(getYieldCardState(sinArriendo, opts)).toEqual({
      mode: 'empty',
      message: 'Aún no hay arriendos registrados en el rango elegido.'
    });
    expect(
      getYieldCardState(sinArriendo, { hasIncomeLink: false, incomesFailed: false })
    ).toMatchObject({
      mode: 'empty',
      message: expect.stringMatching(/Sin arriendo vinculado/)
    });
    expect(
      getYieldCardState(sinArriendo, { hasIncomeLink: true, incomesFailed: true })
    ).toMatchObject({
      mode: 'empty',
      message: expect.stringMatching(/No se pudieron cargar los ingresos/)
    });
  });

  it('un lote sin arriendo ni costo → vacío', () => {
    expect(getYieldCardState(m([], []), opts).mode).toBe('empty');
  });
});
