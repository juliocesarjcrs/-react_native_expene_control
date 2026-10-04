import { AssetRecord } from '~/shared/types/utils/commentaryParser/asset-metrics.types';
import { computeAssetMetrics } from '~/utils/commentaryParser/assetAnalytics';

const rec = (
  id: number,
  cost: number,
  commentary: string,
  nature: 'investment' | 'operational',
  date: string
): AssetRecord => ({ id, cost, commentary, nature, date });

const AS_OF = '2026-10-02';

// ── Lote La Coqueta (tus datos reales, comentarios en formato nuevo) ──────
const LOTE: AssetRecord[] = [
  rec(53321, 5_000_000, 'Promesa: compraventa', 'investment', '2026-01-10'),
  rec(53444, 73_000_000, 'Abono: antes de escrituras', 'investment', '2026-02-10'),
  rec(53445, 164_000, '4x1000: Nubank a Bancolombia $73.000.000', 'investment', '2026-02-10'),
  rec(53468, 52_000_000, 'Saldo: firma de escrituras', 'investment', '2026-03-10'),
  rec(53469, 208_000, '4x1000: Nubank a Bancolombia $52.000.000', 'investment', '2026-03-10'),
  rec(
    53476,
    2_987_000,
    'Escrituración: notariales 2,3% [Valor escritura $130.000.000]',
    'investment',
    '2026-03-10'
  )
];

describe('Lote — sin arriendo ni préstamo', () => {
  const m = computeAssetMetrics({ expenses: LOTE, incomes: [], asOf: AS_OF });

  it('costo total = compra + escrituración + 4x1000', () => {
    expect(m.cost.purchase).toBe(130_000_000);
    expect(m.cost.acquisitionCosts).toBe(2_987_000 + 164_000 + 208_000);
    expect(m.cost.total).toBe(133_359_000);
  });

  it('la compra cuadra con la escritura', () => {
    expect(m.cost.deedValue).toBe(130_000_000);
    expect(m.cost.purchaseGap).toBe(0);
  });

  it('sin préstamo: deuda 0 y capital propio = costo', () => {
    expect(m.debt).toMatchObject({ hasLoan: false, balance: 0 });
    expect(m.equity).toBe(133_359_000);
  });

  it('sin arriendo no hay rentabilidad ni recuperación (no inventa números)', () => {
    expect(m.yields).toEqual({ gross: null, net: null, netAfterInterest: null, onEquity: null });
    expect(m.payback).toEqual({ years: null, equityYears: null });
  });

  it('sin avisos con comentarios en formato nuevo', () => {
    expect(m.warnings).toEqual([]);
  });

  it('predial anual se reparte en 12 meses (accrual)', () => {
    const r = computeAssetMetrics({
      expenses: [...LOTE, rec(1, 1_200_000, 'Predial: 2026', 'operational', '2026-02-05')],
      incomes: [],
      asOf: AS_OF
    });
    // ventana ene-sep 2026 sin arriendo: 12 meses terminando en sep → solo ene-sep tienen costo
    expect(r.annual.opexByBucket.taxes).toBeCloseTo(900_000);
    expect(r.monthly.find((x) => x.month === '2026-01')?.opex.taxes).toBeCloseTo(100_000);
  });
});

// ── Torre 2 Apt 1102 (con arriendo y préstamo familiar de 85 M) ───────────
const TORRE_EXP: AssetRecord[] = [
  rec(1, 105_000_000, 'Abono: antes de escrituras', 'investment', '2025-12-01'),
  rec(53923, 215_000_000, 'Saldo: firma de escrituras', 'investment', '2026-03-01'),
  rec(
    53926,
    7_714_800,
    'Escrituración: notariales, registro y beneficencia [Valor escritura $320.000.000]',
    'investment',
    '2026-03-01'
  ),
  rec(53924, 777_400, '4x1000: Nubank a Bancolombia $194.350.000', 'investment', '2026-03-01'),
  rec(53925, 7_402, '4x1000: Ualá a Bancolombia $2.714.888', 'investment', '2026-03-01'),
  // préstamo
  rec(
    10,
    1_000_000,
    'Intereses: Abr 2026 [Tasa 14,5% EA] [Saldo $85.000.000]',
    'operational',
    '2026-04-30'
  ),
  rec(11, 10_000_000, 'Abono capital: Abr 2026 [Saldo $75.000.000]', 'investment', '2026-04-30'),
  rec(12, 906_000, 'Intereses: May 2026 [Saldo $75.000.000]', 'operational', '2026-05-30'),
  // operación
  rec(20, 300_000, 'Administración: Abr 2026', 'operational', '2026-04-05'),
  rec(21, 1_200_000, 'Predial: 2026', 'operational', '2026-02-10'),
  rec(54079, 170_000, 'Mantenimiento: Reemplazo vidrios baño', 'operational', '2026-06-15')
];
const rentMonths = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
const TORRE_INC: AssetRecord[] = [
  ...rentMonths.map((ym, i) =>
    rec(
      100 + i,
      2_000_000,
      `Arriendo: ${['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'][i]} 2026`,
      'investment',
      `${ym}-03`
    )
  ),
  rec(200, 2_000_000, 'Depósito: garantía [Inquilino]', 'investment', '2026-03-30'),
  rec(201, 50_000, 'Reembolso: administración Abr 2026', 'investment', '2026-04-20')
];

describe('Torre 2 — arriendo + préstamo', () => {
  const m = computeAssetMetrics({ expenses: TORRE_EXP, incomes: TORRE_INC, asOf: AS_OF });

  it('costo: abono de capital NO suma; compra = 320 M', () => {
    expect(m.cost.purchase).toBe(320_000_000);
    expect(m.cost.acquisitionCosts).toBe(7_714_800 + 777_400 + 7_402);
    expect(m.cost.total).toBe(328_499_602);
    expect(m.cost.purchaseGap).toBe(0);
  });

  it('deuda: último saldo registrado y totales pagados', () => {
    expect(m.debt).toMatchObject({
      hasLoan: true,
      balance: 75_000_000,
      asOfDate: '2026-05-30',
      interestPaid: 1_906_000,
      principalPaid: 10_000_000
    });
    expect(m.equity).toBe(328_499_602 - 75_000_000);
  });

  it('depósito en garantía no es ingreso', () => {
    expect(m.depositsHeld).toBe(2_000_000);
    expect(m.monthly.reduce((s, r) => s + r.rent, 0)).toBe(12_000_000);
  });

  it('ventana: abr–sep (6 meses), anualizada', () => {
    expect(m.window).toEqual({ start: '2026-04', end: '2026-09', months: 6, annualized: true });
    expect(m.warnings.some((w) => w.code === 'annualized')).toBe(true);
  });

  it('opex de la ventana: admin (neto de reembolso), predial prorrateado, mantenimiento', () => {
    // ventana de 6 meses → factor 2
    expect(m.annual.opexByBucket.admin).toBeCloseTo((300_000 - 50_000) * 2);
    expect(m.annual.opexByBucket.taxes).toBeCloseTo(600_000 * 2);
    expect(m.annual.opexByBucket.repairs).toBeCloseTo(170_000 * 2);
    expect(m.annual.opex).toBeCloseTo(1_020_000 * 2);
  });

  it('neto anual antes y después de intereses', () => {
    expect(m.annual.rent).toBeCloseTo(24_000_000);
    expect(m.annual.net).toBeCloseTo(21_960_000);
    expect(m.annual.interest).toBeCloseTo(1_906_000 * 2);
    expect(m.annual.netAfterInterest).toBeCloseTo(18_148_000);
    expect(m.annual.averageMonthlyNet).toBeCloseTo(21_960_000 / 12);
  });

  it('rentabilidades y recuperación', () => {
    expect(m.yields.gross).toBeCloseTo(24_000_000 / 328_499_602, 6);
    expect(m.yields.net).toBeCloseTo(21_960_000 / 328_499_602, 6);
    expect(m.yields.netAfterInterest).toBeCloseTo(18_148_000 / 328_499_602, 6);
    expect(m.yields.onEquity).toBeCloseTo(18_148_000 / 253_499_602, 6);
    expect(m.payback.years).toBeCloseTo(328_499_602 / 21_960_000, 4);
    expect(m.payback.equityYears).toBeCloseTo(253_499_602 / 18_148_000, 4);
  });

  it('base de caja: el predial pagado en febrero cae fuera de la ventana', () => {
    const c = computeAssetMetrics({
      expenses: TORRE_EXP,
      incomes: TORRE_INC,
      asOf: AS_OF,
      basis: 'cash'
    });
    expect(c.annual.opexByBucket.taxes).toBe(0);
  });

  it('serie mensual: desde el primer mes con movimiento (el predial 2026 arranca en enero) hasta el mes actual', () => {
    expect(m.monthly[0].month).toBe('2026-01');
    expect(m.monthly[m.monthly.length - 1].month).toBe('2026-10');
    expect(m.monthly.find((r) => r.month === '2026-04')).toMatchObject({
      rent: 2_000_000,
      interest: 1_000_000
    });
  });
});

describe('avisos y casos límite', () => {
  it('comentarios viejos: investment cuenta como costo, operational como "otros"', () => {
    const m = computeAssetMetrics({
      expenses: [
        rec(1, 10_000_000, 'Cuota # 18/23', 'investment', '2026-01-01'),
        rec(2, 50_000, 'arreglo llave', 'operational', '2026-02-01')
      ],
      incomes: [],
      asOf: AS_OF
    });
    expect(m.cost.unclassified).toBe(10_000_000);
    expect(m.cost.total).toBe(10_000_000);
    expect(m.warnings.filter((w) => w.code === 'unparsed')).toHaveLength(2);
  });

  it('nature distinta a la esperada: gana el concepto y avisa', () => {
    const m = computeAssetMetrics({
      expenses: [rec(1, 1_200_000, 'Predial: 2026', 'investment', '2026-02-05')],
      incomes: [],
      asOf: AS_OF
    });
    expect(m.cost.total).toBe(0); // no se contó como costo
    // accrual hasta el mes actual: ene–oct = 10/12 del predial (nov y dic aún no ocurren)
    expect(m.monthly.reduce((s, r) => s + r.opex.taxes, 0)).toBeCloseTo(1_000_000);
    expect(m.warnings.some((w) => w.code === 'natureMismatch')).toBe(true);
  });

  it('recurrente sin año: usa la fecha de pago y avisa', () => {
    const m = computeAssetMetrics({
      expenses: [rec(1, 300_000, 'Administración: marzo', 'operational', '2026-03-05')],
      incomes: [],
      asOf: AS_OF
    });
    expect(m.monthly.find((r) => r.month === '2026-03')?.opex.admin).toBe(300_000);
    expect(m.warnings.some((w) => w.code === 'missingPeriod')).toBe(true);
  });

  it('préstamo sin [Saldo $...]: deuda y capital propio desconocidos', () => {
    const m = computeAssetMetrics({
      expenses: [
        rec(1, 100_000_000, 'Saldo: firma de escrituras', 'investment', '2026-01-01'),
        rec(2, 900_000, 'Intereses: Abr 2026', 'operational', '2026-04-30')
      ],
      incomes: [rec(3, 1_000_000, 'Arriendo: Abr 2026', 'investment', '2026-04-03')],
      asOf: AS_OF
    });
    expect(m.debt.balance).toBeNull();
    expect(m.equity).toBeNull();
    expect(m.yields.onEquity).toBeNull();
    expect(m.yields.gross).not.toBeNull();
    expect(m.warnings.some((w) => w.code === 'debtBalanceMissing')).toBe(true);
  });

  it('mismo día con interés y abono: toma el saldo más bajo', () => {
    const m = computeAssetMetrics({
      expenses: [
        rec(1, 1_000_000, 'Intereses: Abr 2026 [Saldo $85.000.000]', 'operational', '2026-04-30'),
        rec(
          2,
          10_000_000,
          'Abono capital: Abr 2026 [Saldo $75.000.000]',
          'investment',
          '2026-04-30'
        )
      ],
      incomes: [],
      asOf: AS_OF
    });
    expect(m.debt.balance).toBe(75_000_000);
  });

  it('ingreso sin formato o con concepto de gasto no se cuenta', () => {
    const m = computeAssetMetrics({
      expenses: [],
      incomes: [
        rec(1, 2_000_000, 'pago inquilino', 'investment', '2026-04-03'),
        rec(2, 500_000, 'Predial: 2026', 'investment', '2026-04-03')
      ],
      asOf: AS_OF
    });
    expect(m.annual.rent).toBe(0);
    expect(m.warnings.map((w) => w.code).sort()).toEqual(['unparsed', 'wrongDirection']);
  });

  it('reembolso sin cubeta reconocible va a "otros"; Venta se ignora con aviso', () => {
    const m = computeAssetMetrics({
      expenses: [],
      incomes: [
        rec(1, 40_000, 'Reembolso: pintura Abr 2026', 'investment', '2026-04-20'),
        rec(2, 9_000_000, 'Venta: escritura', 'investment', '2026-05-20')
      ],
      asOf: AS_OF
    });
    expect(m.monthly.find((r) => r.month === '2026-04')?.opex.other).toBe(-40_000);
    expect(m.warnings.some((w) => w.code === 'ignored')).toBe(true);
  });

  it('sin ningún dato no lanza y devuelve ceros', () => {
    const m = computeAssetMetrics({ expenses: [], incomes: [], asOf: AS_OF });
    expect(m.cost.total).toBe(0);
    expect(m.yields.gross).toBeNull();
    expect(m.window).toMatchObject({ months: 12, annualized: false });
    expect(m.annual.net).toBe(0);
  });

  it('arriendo solo en el mes actual: ventana vacía, sin rentabilidad', () => {
    const m = computeAssetMetrics({
      expenses: [rec(1, 100_000_000, 'Saldo: firma', 'investment', '2026-01-01')],
      incomes: [rec(2, 1_000_000, 'Arriendo: Oct 2026', 'investment', '2026-10-01')],
      asOf: AS_OF
    });
    expect(m.window.months).toBe(0);
    expect(m.yields.gross).toBeNull();
  });
});

describe('fechas inválidas y origen de los avisos', () => {
  it('fecha ilegible: cuenta en el costo, no en los meses, y avisa', () => {
    const m = computeAssetMetrics({
      expenses: [
        rec(1, 100_000_000, 'Saldo: firma de escrituras', 'investment', '03/03/2026'),
        rec(2, 300_000, 'Administración: Mar 2026', 'operational', 'ayer')
      ],
      incomes: [],
      asOf: AS_OF
    });
    expect(m.cost.total).toBe(100_000_000);
    expect(
      m.warnings
        .filter((w) => w.code === 'badDate')
        .map((w) => w.id)
        .sort()
    ).toEqual([1, 2]);
  });

  it('los avisos indican si vienen de un gasto o de un ingreso', () => {
    const m = computeAssetMetrics({
      expenses: [rec(7, 1_000, 'texto libre', 'operational', '2026-03-05')],
      incomes: [rec(7, 2_000, 'otro texto', 'investment', '2026-03-05')],
      asOf: AS_OF
    });
    const unparsed = m.warnings.filter((w) => w.code === 'unparsed');
    expect(unparsed.map((w) => w.source).sort()).toEqual(['expense', 'income']);
  });
});

describe('categoría compartida "Arriendos": filtro por [Bien: ...]', () => {
  const EXP = [rec(1, 100_000_000, 'Saldo: firma de escrituras', 'investment', '2026-01-01')];
  const INC: AssetRecord[] = [
    rec(1, 2_000_000, 'Arriendo: Oct 2026 [Bien: Apt 1102]', 'investment', '2026-10-03'),
    rec(2, 150_000, 'Arriendo: Oct 2026 [Bien: Local 133]', 'investment', '2026-10-05'),
    rec(3, 150_000, '54 pago 50% Local 133 Piedecuesta Sep 2026', 'investment', '2026-09-27'), // viejo, sin formato
    rec(
      4,
      50_000,
      'Reembolso: administración Oct 2026 [Bien: Local 133]',
      'investment',
      '2026-10-06'
    ),
    rec(5, 2_000_000, 'Depósito: garantía [Bien: Apt 1102]', 'investment', '2026-09-29')
  ];
  const run = (aliases?: string[]) =>
    computeAssetMetrics({
      expenses: EXP,
      incomes: INC,
      asOf: '2026-11-02',
      propertyAliases: aliases
    });

  it('solo cuentan los ingresos del bien indicado', () => {
    const m = run(['Apt 1102']);
    expect(m.monthly.reduce((s, r) => s + r.rent, 0)).toBe(2_000_000);
    expect(m.depositsHeld).toBe(2_000_000); // el depósito es de este bien
    expect(m.monthly.reduce((s, r) => s + r.opex.admin, 0)).toBe(0); // el reembolso es del Local
  });

  it('el otro bien ve lo suyo, incluido el reembolso', () => {
    const m = run(['Local 133']);
    expect(m.monthly.reduce((s, r) => s + r.rent, 0)).toBe(150_000);
    expect(m.depositsHeld).toBe(0);
    expect(m.monthly.reduce((s, r) => s + r.opex.admin, 0)).toBe(-50_000);
  });

  it('un solo aviso agrupado para lo que no se puede asignar (no uno por fila)', () => {
    const w = run(['Apt 1102']).warnings.filter((x) => x.code === 'unassignedIncome');
    expect(w).toHaveLength(1);
    expect(w[0].message).toMatch(/^1 ingreso/);
    expect(run(['Apt 1102']).warnings.some((x) => x.code === 'unparsed')).toBe(false);
  });

  it('el nombre se compara sin mayúsculas, tildes ni puntuación; admite varios nombres', () => {
    expect(run(['apt. 1102']).monthly.reduce((s, r) => s + r.rent, 0)).toBe(2_000_000);
    expect(run(['Apto 1102', 'APT 1102']).monthly.reduce((s, r) => s + r.rent, 0)).toBe(2_000_000);
  });

  it('sin nombres se cuentan todos los ingresos (comportamiento anterior)', () => {
    expect(run().monthly.reduce((s, r) => s + r.rent, 0)).toBe(2_000_000 + 150_000);
    expect(run([]).warnings.some((x) => x.code === 'unassignedIncome')).toBe(false);
  });
});

describe('arriendo con fechas que cruzan de mes', () => {
  it('se reparte por días entre los dos meses', () => {
    const m = computeAssetMetrics({
      expenses: [rec(1, 100_000_000, 'Saldo: firma', 'investment', '2026-01-01')],
      incomes: [
        rec(
          1,
          3_100_000,
          'Arriendo: 15 Oct - 14 Nov 2026 [Bien: Apt 1102]',
          'investment',
          '2026-10-15'
        )
      ],
      asOf: '2026-12-02',
      propertyAliases: ['Apt 1102']
    });
    expect(m.monthly.find((r) => r.month === '2026-10')?.rent).toBeCloseTo(1_700_000);
    expect(m.monthly.find((r) => r.month === '2026-11')?.rent).toBeCloseTo(1_400_000);
  });

  it('base de caja: todo cae en el mes del pago', () => {
    const m = computeAssetMetrics({
      expenses: [],
      incomes: [rec(1, 3_100_000, 'Arriendo: 15 Oct - 14 Nov 2026', 'investment', '2026-10-15')],
      asOf: '2026-12-02',
      basis: 'cash'
    });
    expect(m.monthly.find((r) => r.month === '2026-10')?.rent).toBe(3_100_000);
    expect(m.monthly.find((r) => r.month === '2026-11')?.rent).toBe(0);
  });
});
