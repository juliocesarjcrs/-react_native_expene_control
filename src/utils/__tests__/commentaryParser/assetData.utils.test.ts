import {
  analyzeAsset,
  toAssetRecord,
  toISODate,
  RawRecord
} from '~/utils/commentaryParser/assetData.utils';

const raw = (over: Partial<RawRecord> & { id: number }): RawRecord => ({
  cost: 1_000,
  commentary: '',
  nature: 'operational',
  date: '2026-03-05',
  ...over
});

describe('toAssetRecord', () => {
  it('comentario null/undefined → cadena vacía', () => {
    expect(toAssetRecord(raw({ id: 1, commentary: null })).commentary).toBe('');
    expect(toAssetRecord(raw({ id: 1, commentary: undefined })).commentary).toBe('');
  });

  it('solo "investment" es capital; nature ausente o desconocida → operational', () => {
    expect(toAssetRecord(raw({ id: 1, nature: 'investment' })).nature).toBe('investment');
    expect(toAssetRecord(raw({ id: 1, nature: 'operational' })).nature).toBe('operational');
    expect(toAssetRecord(raw({ id: 1, nature: null })).nature).toBe('operational');
    expect(toAssetRecord(raw({ id: 1, nature: undefined })).nature).toBe('operational');
    expect(toAssetRecord(raw({ id: 1, nature: 'otra-cosa' })).nature).toBe('operational');
  });
});

describe('analyzeAsset', () => {
  const AS_OF = '2026-10-02';

  it('calcula métricas y deja los comentarios sin formato para editar', () => {
    const { metrics, unrecognized } = analyzeAsset({
      expenses: [
        raw({
          id: 1,
          cost: 100_000_000,
          commentary: 'Saldo: firma de escrituras',
          nature: 'investment'
        }),
        raw({
          id: 2,
          cost: 10_000_000,
          commentary: 'Cuota # 18/23',
          nature: 'investment',
          date: '2026-01-01'
        }),
        raw({ id: 3, cost: 50_000, commentary: null })
      ],
      incomes: [],
      asOf: AS_OF
    });
    expect(metrics.cost.total).toBe(110_000_000);
    expect(unrecognized.map((u) => u.id).sort()).toEqual([2, 3]);
    expect(unrecognized.find((u) => u.id === 3)).toEqual({
      id: 3,
      commentary: '',
      cost: 50_000,
      date: '2026-03-05'
    });
  });

  it('un ingreso sin formato NO aparece como gasto editable aunque comparta id', () => {
    const { metrics, unrecognized } = analyzeAsset({
      expenses: [raw({ id: 7, commentary: 'Administración: Mar 2026' })],
      incomes: [
        raw({ id: 7, cost: 2_000_000, commentary: 'pago inquilino', nature: 'investment' })
      ],
      asOf: AS_OF
    });
    expect(unrecognized).toEqual([]);
    expect(metrics.warnings.some((w) => w.code === 'unparsed' && w.source === 'income')).toBe(true);
  });

  it('con arriendo calcula rentabilidad', () => {
    const { metrics } = analyzeAsset({
      expenses: [
        raw({ id: 1, cost: 100_000_000, commentary: 'Saldo: firma', nature: 'investment' })
      ],
      incomes: ['Abr', 'May', 'Jun'].map((m, i) =>
        raw({
          id: 10 + i,
          cost: 1_000_000,
          commentary: `Arriendo: ${m} 2026`,
          nature: 'investment',
          date: `2026-0${4 + i}-03`
        })
      ),
      asOf: AS_OF
    });
    expect(metrics.window.months).toBe(6); // abr–sep
    expect(metrics.annual.rent).toBeCloseTo(6_000_000); // 3 meses × 1 M × (12/6)
    expect(metrics.yields.gross).toBeCloseTo(0.06);
  });
});

describe('toISODate', () => {
  it('usa la fecha local con ceros a la izquierda', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});
