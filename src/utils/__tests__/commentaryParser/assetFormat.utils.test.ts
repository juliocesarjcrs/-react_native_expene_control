import {
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
