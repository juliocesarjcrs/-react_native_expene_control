/**
 * retentionParser.test.ts
 * Ubicación: src/utils/__tests__/commentaryParser/retentionParser.test.ts
 *
 * Tests con comentarios reales de la BD (IDs: 2652, 2659, 2663, 2669, 2679).
 */

import { parseRetentionCommentary } from '~/utils/commentaryParser/retentionParser';

const MOCK_COST = 5000000;
const MOCK_DATE = '2026-02-25';
const MOCK_CATEGORY = 'Ingresos';

describe('retentionParser — casos válidos', () => {
  test('nómina simple (id: 2659)', () => {
    const r = parseRetentionCommentary(
      'Retefu: 517.000 (sin incapacidad)',
      MOCK_COST,
      MOCK_DATE,
      MOCK_CATEGORY
    );
    expect(r).not.toBeNull();
    expect(r!.retention).toBe(517000);
    expect(r!.incapacidad).toBeUndefined();
    expect(r!.primas).toBeUndefined();
  });

  test('con incapacidad primeros días (id: 2652)', () => {
    const r = parseRetentionCommentary(
      'Retefu: 517.000\nIncapacidad: Prim: 2 días',
      MOCK_COST,
      MOCK_DATE,
      MOCK_CATEGORY
    );
    expect(r).not.toBeNull();
    expect(r!.retention).toBe(517000);
    expect(r!.incapacidad!.primDays).toBe(2);
    expect(r!.incapacidad!.epsDays).toBe(0);
    expect(r!.incapacidad!.totalDays).toBe(2);
  });

  test('con incapacidad EPS días sumados (id: 2679)', () => {
    const r = parseRetentionCommentary(
      'Retefu: 635.000\nIncapacidad: Prim: 2+2 días, Eps: 1+3+13+13 días',
      MOCK_COST,
      MOCK_DATE,
      MOCK_CATEGORY
    );
    expect(r).not.toBeNull();
    expect(r!.retention).toBe(635000);
    expect(r!.incapacidad!.primDays).toBe(4); // 2+2
    expect(r!.incapacidad!.epsDays).toBe(30); // 1+3+13+13
    expect(r!.incapacidad!.totalDays).toBe(34);
  });

  test('con prima navidad y retención (id: 2669)', () => {
    const r = parseRetentionCommentary(
      'Retefu: 609.000\nPrima gest: 1.555.000\nIncapacidad: Prim: 2+2 días',
      MOCK_COST,
      MOCK_DATE,
      MOCK_CATEGORY
    );
    expect(r).not.toBeNull();
    expect(r!.retention).toBe(609000);
    expect(r!.primas).toHaveLength(1);
    expect(r!.primas![0].type).toBe('gest');
    expect(r!.primas![0].amount).toBe(1555000);
    expect(r!.totalRetentionWithPrimas).toBe(609000 + 1555000);
  });

  test('monto en miles (635 mil)', () => {
    const r = parseRetentionCommentary('Retefu: 635 mil', MOCK_COST, MOCK_DATE, MOCK_CATEGORY);
    expect(r).not.toBeNull();
    expect(r!.retention).toBe(635000);
  });

  test('calcula descuento EPS con salario base', () => {
    const r = parseRetentionCommentary(
      'Retefu: 517.000\nIncapacidad: Prim: 2 días, Eps: 13 días',
      MOCK_COST,
      MOCK_DATE,
      MOCK_CATEGORY,
      3000000 // salario base
    );
    expect(r).not.toBeNull();
    expect(r!.incapacidad!.dailySalary).toBe(100000); // 3000000/30
    expect(r!.incapacidad!.totalDiscount).toBeGreaterThan(0);
  });
});

describe('retentionParser — retorna null', () => {
  test('sin Retefu → null', () => {
    expect(
      parseRetentionCommentary('Bonificación Anual', MOCK_COST, MOCK_DATE, MOCK_CATEGORY)
    ).toBeNull();
  });

  test('Bono SineDian → null', () => {
    expect(
      parseRetentionCommentary('Bono SineDian', MOCK_COST, MOCK_DATE, MOCK_CATEGORY)
    ).toBeNull();
  });

  test('texto vacío → null', () => {
    expect(parseRetentionCommentary('', MOCK_COST, MOCK_DATE, MOCK_CATEGORY)).toBeNull();
  });
});
