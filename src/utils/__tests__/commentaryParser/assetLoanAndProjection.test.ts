import { AssetRecord } from '~/shared/types/utils/commentaryParser/asset-metrics.types';
import { computeAssetMetrics } from '~/utils/commentaryParser/assetAnalytics';
import { parseAssetCommentary } from '~/utils/commentaryParser/assetParser';

const rec = (
  id: number,
  cost: number,
  commentary: string,
  nature: 'investment' | 'operational',
  date: string
): AssetRecord => ({ id, cost, commentary, nature, date });

describe('[Préstamo directo $...] — parser', () => {
  const parse = (t: string) => parseAssetCommentary(t, 215_000_000, '2026-09-15');

  it('extrae el monto y lo quita de las etiquetas y del detalle', () => {
    const r = parse('Saldo: firma de escritura [Préstamo directo $85.000.000]');
    expect(r?.concept).toBe('balance');
    expect(r?.directLoan).toBe(85_000_000);
    expect(r?.tags).toEqual([]);
    expect(r?.referenceAmount).toBeUndefined();
  });

  it('acepta "Prestamo directo" sin tilde y sin mayúsculas', () => {
    expect(parse('Saldo: firma [prestamo directo $85.000.000]')?.directLoan).toBe(85_000_000);
  });

  it('sin monto legible queda entre las etiquetas sueltas', () => {
    const r = parse('Saldo: firma [Préstamo directo]');
    expect(r?.directLoan).toBeUndefined();
    expect(r?.tags).toEqual(['Préstamo directo']);
  });
});

// ── Torre 2: estado real al 29 oct 2026, con la etiqueta y la energía corregida ──
const TORRE_EXP: AssetRecord[] = [
  rec(1, 20_000_000, 'Promesa: compraventa', 'investment', '2026-08-03'),
  rec(2, 10_000, '4x1000: Nubank a Bancolombia 2.500.000', 'investment', '2026-08-03'),
  rec(3, 6_600, 'Trámite: fotocopia otro Si', 'operational', '2026-08-28'),
  rec(
    4,
    215_000_000,
    'Saldo: firma de escritura [Préstamo directo $85.000.000]',
    'investment',
    '2026-09-15'
  ),
  rec(
    5,
    777_400,
    '4x1000: Nubank a Bancolombia  transferir 194.350.000',
    'investment',
    '2026-09-15'
  ),
  rec(
    6,
    7_402,
    '4x1000: Ualá por PSE $2.714.888\nAl superar 3 millones al mes',
    'investment',
    '2026-09-15'
  ),
  rec(
    7,
    7_714_800,
    'Escrituracion: notariales, registro y beneficencia [Valor escritura $320.000.000]',
    'investment',
    '2026-09-15'
  ),
  rec(8, 170_000, 'Mantenimiento: Reemplazo vidrios baño', 'operational', '2026-09-29'),
  rec(9, 18_000, 'Autenticar: Contrato arrendamiento', 'operational', '2026-09-30'),
  rec(10, 35_450, 'Servicios: Agua 17 Ago - 14 Sep 2026', 'operational', '2026-09-30'),
  rec(
    11,
    340_000,
    '4x1000: Nubank a Bancolombia $85.000.000 préstamo Gladys',
    'investment',
    '2026-10-01'
  ),
  rec(12, 571_026, 'Seguro: HDI 06 Oct 2026 - 06 Oct 2027', 'operational', '2026-10-06'),
  rec(13, 362_000, 'Administración: Oct 2026', 'operational', '2026-10-07'),
  rec(14, 4_392, 'Servicios: Gas 28 Ago - 27 Sep 2026', 'operational', '2026-10-09'),
  rec(15, 38_870, 'Servicios: Energia 17 Sep - 30 Sep 2026', 'operational', '2026-10-21'),
  rec(
    16,
    632_315,
    'Intereses: Oct 2026 [Tasa 9,40% EA] [Saldo $85.000.000]',
    'operational',
    '2026-10-28'
  )
];
const TORRE_INC: AssetRecord[] = [
  rec(
    1,
    2_000_000,
    'Arriendo: #1 01 Oct - 30 Oct 2026[Bien:Torre 2 Apt 1102]',
    'investment',
    '2026-09-29'
  )
];

describe('Torre 2 real — préstamo directo, proyección anual y vacancia', () => {
  const m = computeAssetMetrics({
    expenses: TORRE_EXP,
    incomes: TORRE_INC,
    asOf: '2026-10-29',
    propertyAliases: ['Torre 2 Apt 1102']
  });

  it('costo: la compra sube a 320 M y el faltante vs escritura es 0', () => {
    expect(m.cost.purchase).toBe(320_000_000);
    expect(m.cost.directLoan).toBe(85_000_000);
    expect(m.cost.acquisitionCosts).toBe(8_849_602);
    expect(m.cost.total).toBe(328_849_602);
    expect(m.cost.deedValue).toBe(320_000_000);
    expect(m.cost.purchaseGap).toBe(0);
  });

  it('deuda 85 M (sin estimar) y capital propio = lo que pagaste', () => {
    expect(m.debt).toMatchObject({
      hasLoan: true,
      balance: 85_000_000,
      estimated: false,
      asOfDate: '2026-10-28',
      interestPaid: 632_315,
      principalPaid: 0
    });
    expect(m.equity).toBe(243_849_602);
    expect(m.warnings.some((w) => w.code === 'debtBalanceMissing')).toBe(false);
  });

  it('ventana provisional de octubre; seguro por valor completo y servicios en 0', () => {
    expect(m.window).toMatchObject({ start: '2026-10', months: 1, provisional: true });
    expect(m.annual.opexByBucket.admin).toBeCloseTo(4_344_000, 2);
    expect(m.annual.opexByBucket.insurance).toBeCloseTo(571_026, 2);
    expect(m.annual.opexByBucket.utilities).toBeCloseTo(0, 2);
    expect(m.annual.opex).toBeCloseTo(4_915_026, 2);
  });

  it('neta anual, después de intereses y rentabilidades', () => {
    expect(m.annual.rent).toBeCloseTo(24_000_000, 2);
    expect(m.annual.net).toBeCloseTo(19_084_974, 2);
    expect(m.annual.interest).toBeCloseTo(7_587_780, 2);
    expect(m.annual.netAfterInterest).toBeCloseTo(11_497_194, 2);
    expect(m.yields.gross).toBeCloseTo(24_000_000 / 328_849_602, 6);
    expect(m.yields.net).toBeCloseTo(19_084_974 / 328_849_602, 6);
    expect(m.yields.onEquity).toBeCloseTo(11_497_194 / 243_849_602, 6);
    expect(m.payback.years).toBeCloseTo(328_849_602 / 19_084_974, 4);
  });

  it('gastos antes del primer arriendo = 273.312', () => {
    expect(m.vacancyOpex).toBeCloseTo(273_312, 2);
  });

  it('el mes de octubre sigue mostrando solo la parte de la póliza que le toca', () => {
    expect(m.monthly.find((r) => r.month === '2026-10')?.opex.insurance).toBeCloseTo(
      (571_026 * 26) / 366,
      2
    );
  });
});

describe('vacancia', () => {
  it('sin arriendo es null', () => {
    const m = computeAssetMetrics({ expenses: TORRE_EXP, incomes: [], asOf: '2026-10-29' });
    expect(m.vacancyOpex).toBeNull();
  });
});

describe('[Préstamo directo] fuera de la compra', () => {
  it('se ignora con aviso y no crea deuda', () => {
    const m = computeAssetMetrics({
      expenses: [
        rec(
          1,
          1_000_000,
          'Mejora: pintura [Préstamo directo $5.000.000]',
          'investment',
          '2026-05-01'
        )
      ],
      incomes: [],
      asOf: '2026-10-29'
    });
    expect(m.debt.hasLoan).toBe(false);
    expect(m.cost.total).toBe(1_000_000);
    expect(m.warnings.some((w) => w.code === 'directLoanIgnored')).toBe(true);
  });
});

describe('deuda híbrida — abonos a capital posteriores al último saldo', () => {
  const BASE: AssetRecord[] = [
    rec(1, 215_000_000, 'Saldo: firma [Préstamo directo $85.000.000]', 'investment', '2026-09-15'),
    rec(2, 632_315, 'Intereses: Oct 2026 [Saldo $85.000.000]', 'operational', '2026-10-28')
  ];
  const run = (extra: AssetRecord[]) =>
    computeAssetMetrics({ expenses: [...BASE, ...extra], incomes: [], asOf: '2026-11-05' });

  it('abono sin [Saldo] posterior al saldo: se resta y la deuda queda "estimada"', () => {
    const m = run([rec(3, 5_000_000, 'Abono capital: Nov 2026', 'investment', '2026-11-02')]);
    expect(m.debt.balance).toBe(80_000_000);
    expect(m.debt.estimated).toBe(true);
    expect(m.warnings.some((w) => w.code === 'debtEstimated')).toBe(true);
  });

  it('abono sin [Saldo] el mismo día que unos Intereses: también se resta', () => {
    const m = run([rec(3, 5_000_000, 'Abono capital: Oct 2026', 'investment', '2026-10-28')]);
    expect(m.debt.balance).toBe(80_000_000);
    expect(m.debt.estimated).toBe(true);
  });

  it('un [Saldo] más reciente manda y la deuda deja de ser estimada', () => {
    const m = run([
      rec(3, 5_000_000, 'Abono capital: Nov 2026', 'investment', '2026-11-02'),
      rec(4, 600_000, 'Intereses: Nov 2026 [Saldo $80.000.000]', 'operational', '2026-11-04')
    ]);
    expect(m.debt.balance).toBe(80_000_000);
    expect(m.debt.estimated).toBe(false);
  });

  it('abono CON [Saldo] el mismo día que unos Intereses: el saldo ya es posterior al abono', () => {
    const m = run([
      rec(3, 5_000_000, 'Abono capital: Oct 2026 [Saldo $80.000.000]', 'investment', '2026-10-28'),
      rec(4, 1_000_000, 'Abono capital: Oct 2026', 'investment', '2026-10-28')
    ]);
    // el abono sin saldo del mismo día ya está incluido en el [Saldo] de ese día
    expect(m.debt.balance).toBe(80_000_000);
    expect(m.debt.estimated).toBe(false);
  });

  it('la deuda no baja de 0', () => {
    const m = run([rec(3, 90_000_000, 'Abono capital: Nov 2026', 'investment', '2026-11-02')]);
    expect(m.debt.balance).toBe(0);
  });
});
