import {
  getAssetTemplateConfig,
  validateAssetCommentary
} from '~/utils/commentary/assetTemplates.utils';
import { parseAssetCommentary } from '~/utils/commentaryParser/assetParser';

const COST = 1_000;
const DATE = '2026-03-01';
const parse = (t: string) => parseAssetCommentary(t, COST, DATE);

describe('parseAssetCommentary — adquisición', () => {
  it('Promesa / Abono / Saldo → cubeta purchase, investment', () => {
    for (const [text, concept] of [
      ['Promesa: compraventa', 'promise'],
      ['Abono: antes de escrituras', 'downPayment'],
      ['Saldo: firma de escrituras', 'balance']
    ] as const) {
      const r = parse(text);
      expect(r?.concept).toBe(concept);
      expect(r?.bucket).toBe('purchase');
      expect(r?.expectedNature).toBe('investment');
    }
  });

  it('Escrituración extrae % y valor de escritura', () => {
    const r = parse('Escrituración: notariales 2,3% [Valor escritura $130.000.000]');
    expect(r?.concept).toBe('closingCosts');
    expect(r?.percentage).toBe(2.3);
    expect(r?.deedValue).toBe(130_000_000);
    expect(r?.tags).toEqual([]);
  });

  it('Escrituración sin tilde y con valor de 320 M', () => {
    const r = parse(
      'Escrituracion: notariales, registro y beneficencia [Valor escritura $320.000.000]'
    );
    expect(r?.deedValue).toBe(320_000_000);
  });

  it('4x1000 extrae el monto transferido y hereda nature', () => {
    const r = parse('4x1000: Nubank a Bancolombia $73.000.000');
    expect(r?.concept).toBe('bankTax');
    expect(r?.referenceAmount).toBe(73_000_000);
    expect(r?.expectedNature).toBeNull();
  });

  it('acepta "4 x mil", "4× mil" (teclado del celular) y "4 por mil"', () => {
    for (const t of ['4 x mil', '4× mil', '4 por mil'])
      expect(parse(`${t}: Nubank a Bancolombia $2.714.888`)?.concept).toBe('bankTax');
  });
});

describe('parseAssetCommentary — operación y períodos', () => {
  it('mes simple', () => {
    const p = parse('Administración: Mar 2026')?.period;
    expect(p).toMatchObject({ startMonth: 3, endMonth: 3, startYear: 2026, months: 1 });
    expect(p?.isAnnual).toBe(false);
  });

  it('rango mismo año', () => {
    expect(parse('Administración: Mar-Abr 2026')?.period?.months).toBe(2);
  });

  it('rango cruzando año', () => {
    const p = parse('Administración: Dic 2025 - Ene 2026')?.period;
    expect(p).toMatchObject({
      startYear: 2025,
      startMonth: 12,
      endYear: 2026,
      endMonth: 1,
      months: 2
    });
  });

  it('año completo (predial)', () => {
    const r = parse('Predial: 2026');
    expect(r?.bucket).toBe('taxes');
    expect(r?.period).toMatchObject({ months: 12, isAnnual: true });
  });

  it('mes con nombre completo y typo', () => {
    expect(parse('Administración: Marzo 2026')?.period?.startMonth).toBe(3);
    expect(parse('Administración: Enr 2026')?.period?.startMonth).toBe(1);
  });

  it('Mantenimiento no exige período (ejemplo real de BD)', () => {
    const r = parse('Mantenimiento: Reemplazo vidrios baño');
    expect(r?.concept).toBe('maintenance');
    expect(r?.recurring).toBe(false);
    expect(r?.period).toBeUndefined();
  });
});

describe('parseAssetCommentary — ingresos', () => {
  it('Arriendo mes completo', () => {
    const r = parse('Arriendo: Mar 2026');
    expect(r?.direction).toBe('income');
    expect(r?.isPartial).toBe(false);
  });

  it('Arriendo parcial por días', () => {
    const r = parse('Arriendo: 15 días Mar 2026 [Parcial]');
    expect(r?.isPartial).toBe(true);
    expect(r?.partialDays).toBe(15);
    expect(r?.period?.startMonth).toBe(3);
  });

  it('Depósito es income pero bucket deposit', () => {
    expect(parse('Depósito: garantía [Inquilino]')?.bucket).toBe('deposit');
  });
});

describe('parseAssetCommentary — rechazos', () => {
  it('comentarios viejos sin formato → null', () => {
    expect(parse('Pago promesa compra venta')).toBeNull();
    expect(parse('2.3 % gastos Notariales')).toBeNull();
    expect(parse('')).toBeNull();
  });

  it('concepto desconocido → null', () => {
    expect(parse('Pizza: Mar 2026')).toBeNull();
  });
});

describe('validateAssetCommentary', () => {
  it('valid / warnings', () => {
    expect(validateAssetCommentary('Administración: Mar 2026').state).toBe('valid');
    expect(validateAssetCommentary('Administración: marzo').state).toBe('warning');
    expect(validateAssetCommentary('Pizza: 2026').state).toBe('warning');
    expect(validateAssetCommentary('sin formato').state).toBe('warning');
  });
});

describe('getAssetTemplateConfig — detección', () => {
  const CAT = 'Bancarios y de inversión';

  it('gasto: tus 8 subcategorías reales de Bancarios y de inversión', () => {
    const expected: [string, boolean][] = [
      ['Torre 2 Apt 1102 Mirador Villa Verde', true],
      ['Lote La Coqueta #15 Alcala', true],
      ['Administración- impuesto local Piedecuesta', false], // pendiente de decisión
      ['Cuota manejo y 4× mil', false],
      ['Naturartes', false],
      ['Emigrar', false],
      ['Declaración renta', false],
      ['Compra Apto', false] // conserva "Cuota # n/N"
    ];
    for (const [name, isAsset] of expected) {
      const c = getAssetTemplateConfig(2001, name, CAT);
      expect([name, c?.parserType ?? null]).toEqual([name, isAsset ? 'asset' : null]);
    }
  });

  it('gasto: bienes nuevos con nombres típicos', () => {
    for (const name of ['Casa Dosquebradas', 'Apto 301 Cuba', 'Finca La Esperanza'])
      expect(getAssetTemplateConfig(2002, name, CAT)?.parserType).toBe('asset');
    expect(getAssetTemplateConfig(2003, 'Adaptación', CAT)).toBeNull(); // "adaptación" ≠ "apt"
  });

  it('gasto: cuotas de crédito de un bien quedan fuera', () => {
    expect(getAssetTemplateConfig(2, 'Cuota Apto Mirador', CAT)).toBeNull();
  });

  it('gasto: otras categorías no se tocan (incl. Arriendo que pagas)', () => {
    expect(getAssetTemplateConfig(624, 'Arriendo', 'Vivienda')).toBeNull();
    expect(getAssetTemplateConfig(674, 'Luz', 'Vivienda')).toBeNull();
  });

  it('ingreso: categoría con offset y "Arriendo" en el nombre', () => {
    const c = getAssetTemplateConfig(100_554, 'Arriendo Apt 1102', 'Ingresos');
    expect(c?.parserType).toBe('asset');
    expect(c?.chips.map((x) => x.label)).toEqual(['Arriendo', 'Parcial', 'Reembolso', 'Depósito']);
  });

  it('ingreso: otras categorías de ingreso no se tocan', () => {
    expect(getAssetTemplateConfig(100_300, 'Salario Julio', 'Ingresos')).toBeNull();
  });
});

describe('chips → parser (cada chip debe parsear sin null)', () => {
  const configs = [
    getAssetTemplateConfig(
      2001,
      'Torre 2 Apt 1102 Mirador Villa Verde',
      'Bancarios y de inversión'
    ),
    getAssetTemplateConfig(100_554, 'Arriendo Apt 1102', 'Ingresos')
  ];

  it.each(
    configs.flatMap((c) => c!.chips.map((chip) => [c!.chips.length, chip.label, chip.template]))
  )('chip %s — %s', (_n, label, template) => {
    const r = parse(template as string);
    expect(r).not.toBeNull();
    expect(validateAssetCommentary(template as string).state).toBe('valid');
  });
});

describe('préstamo del bien — Intereses y Abono capital', () => {
  it('Intereses: período, tasa y saldo de deuda', () => {
    const r = parse('Intereses: Mar 2026 [Tasa 14,5% EA] [Saldo $85.000.000]');
    expect(r?.concept).toBe('interest');
    expect(r?.bucket).toBe('interest');
    expect(r?.expectedNature).toBe('operational');
    expect(r?.rate).toBe(14.5);
    expect(r?.rateType).toBe('EA');
    expect(r?.debtBalance).toBe(85_000_000);
    expect(r?.period).toMatchObject({ startMonth: 3, months: 1 });
    expect(r?.referenceAmount).toBeUndefined(); // los $ de las etiquetas no se cuelan al detalle
    expect(r?.tags).toEqual([]);
  });

  it('Abono capital es distinto de Abono (compra) y NO suma al costo', () => {
    const r = parse('Abono capital: Mar 2026 [Saldo $70.000.000]');
    expect(r?.concept).toBe('principalPayment');
    expect(r?.bucket).toBe('principal');
    expect(r?.expectedNature).toBe('investment');
    expect(r?.debtBalance).toBe(70_000_000);
    expect(parse('Abono: antes de escrituras')?.concept).toBe('downPayment');
  });

  it('Saldo como etiqueta no afecta al concepto "Saldo:" de compra', () => {
    const r = parse('Saldo: firma de escrituras');
    expect(r?.concept).toBe('balance');
    expect(r?.debtBalance).toBeUndefined();
  });

  it('tasa sin base y sin saldo es válida', () => {
    const r = parse('Intereses: Abr 2026 [Tasa 15% ]');
    expect(r?.rate).toBe(15);
    expect(r?.rateType).toBeUndefined();
    expect(r?.debtBalance).toBeUndefined();
  });

  it('el validador avisa si el abono a deuda se escribe como "Abono: capital"', () => {
    expect(validateAssetCommentary('Abono: capital Mar 2026').state).toBe('warning');
    expect(validateAssetCommentary('Abono capital: Mar 2026').state).toBe('valid');
    expect(validateAssetCommentary('Intereses: marzo').state).toBe('warning'); // exige año
  });
});

describe('Impuesto = Predial', () => {
  it('"Impuesto:" e "Impuesto predial:" se leen como Predial', () => {
    for (const t of ['Impuesto: Predial 2026', 'Impuesto predial: 2026', 'Impuestos: 2026'])
      expect(parse(t)?.concept).toBe('propertyTax');
  });
});

describe('catálogo de conceptos — invariantes', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ASSET_CONCEPTS } = require('../../../utils/commentaryParser/assetConcepts');
  const entries = Object.entries(ASSET_CONCEPTS) as [string, any][];

  it('ningún alias apunta a dos conceptos', () => {
    const seen = new Map<string, string>();
    for (const [concept, info] of entries)
      for (const alias of info.aliases) {
        expect([alias, seen.get(alias)]).toEqual([alias, undefined]);
        seen.set(alias, concept);
      }
  });

  it('solo Abono capital paga deuda; la compra y mejoras suman al costo', () => {
    const roles = Object.fromEntries(entries.map(([c, i]) => [c, i.capitalRole]));
    expect(roles.principalPayment).toBe('debtRepayment');
    for (const c of ['promise', 'downPayment', 'balance', 'closingCosts', 'improvement'])
      expect(roles[c]).toBe('cost');
    expect(entries.filter(([, i]) => i.capitalRole === 'debtRepayment')).toHaveLength(1);
  });

  it('todo concepto con capitalRole "cost" es investment', () => {
    for (const [, i] of entries)
      if (i.capitalRole === 'cost') expect(i.expectedNature).toBe('investment');
  });
});

describe('chips de gasto — lista final', () => {
  it('14 chips en este orden, sin Impuesto ni Servicios', () => {
    const c = getAssetTemplateConfig(
      2001,
      'Lote La Coqueta #15 Alcala',
      'Bancarios y de inversión'
    );
    expect(c?.chips.map((x) => x.label)).toEqual([
      'Abono',
      'Saldo',
      'Promesa',
      'Escrituración',
      '4x1000',
      'Mejora',
      'Intereses',
      'Abono capital',
      'Administración',
      'Predial',
      'Seguro',
      'Mantenimiento',
      'Comisión',
      'Otros'
    ]);
  });
});
