/**
 * utilityParser.test.ts
 * Ubicación: src/utils/__tests__/commentaryParser/utilityParser.test.ts
 *
 * Tests con comentarios reales de la BD.
 * Documenta el formato esperado y protege contra regresiones.
 */

import { parseUtilityCommentary } from '~/utils/commentaryParser/utilityParser';

const MOCK_COST = 80000;
const MOCK_DATE = '2026-01-17';

// ─────────────────────────────────────────────
// CASOS VÁLIDOS — datos reales de la BD
// ─────────────────────────────────────────────

describe('utilityParser — casos válidos', () => {
  test('solos, sin extras', () => {
    const r = parseUtilityCommentary(
      'Consumo(79 Kw) 18 Dic - 17 Ene 2026 [Solos]',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.consumption).toBe(79);
    expect(r!.unit).toBe('KW');
    expect(r!.isSolo).toBe(true);
    expect(r!.hasExtraPerson).toBe(false);
    expect(r!.periodStart).toBe('18 Dic');
    expect(r!.periodEnd).toContain('17 Ene');
  });

  test('con persona adicional todo el periodo', () => {
    const r = parseUtilityCommentary(
      'Consumo(100 Kw) 18 Nov - 17 Dic 2025 [Con Margot]',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.hasExtraPerson).toBe(true);
    expect(r!.extraPersonName).toBe('Margot');
    expect(r!.extraPersonStartDate).toBeUndefined();
  });

  test('con persona adicional desde fecha intermedia', () => {
    const r = parseUtilityCommentary(
      'Consumo(14 M3) 16 Dic - 15 Ene 2026 [Con Margot (24 Dic - 15 Ene)]',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.unit).toBe('M3');
    expect(r!.hasExtraPerson).toBe(true);
    expect(r!.extraPersonName).toBe('Margot');
    expect(r!.extraPersonStartDate).toBe('24 Dic');
  });

  test('deshabitado N días', () => {
    const r = parseUtilityCommentary(
      'Consumo(79 Kw) 17 Nov - 17 Dic 2025 [Solos] [Deshabitado 6 días]',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.uninhabitedDays).toBe(6);
    expect(r!.isSolo).toBe(true);
  });

  test('con visitas múltiples', () => {
    const r = parseUtilityCommentary(
      'Consumo(66 Kw) 17 Ago - 16 Sep 2024 [Visitas: 3] Familia Silvia 17-19 Ago',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.hasVisits).toBe(true);
    expect(r!.visitsCount).toBe(3);
  });

  test('con visita de una persona', () => {
    const r = parseUtilityCommentary(
      'Consumo(71 Kw) 18 Jul - 16 Ago 2024 [Visita: Monica] 5-10 Ago',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.hasVisits).toBe(true);
    expect(r!.visitsSingleName).toBe('Monica');
  });

  test('gas con M3', () => {
    const r = parseUtilityCommentary(
      'Consumo(13 M3) 16 Ene - 15 Feb 2026 [Solos]',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.consumption).toBe(13);
    expect(r!.unit).toBe('M3');
  });

  test('calcula totalExtraPeople correctamente', () => {
    const r = parseUtilityCommentary(
      'Consumo(90 Kw) 18 Mar - 17 Abr 2026 [Con Margot] [Visitas: 2]',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.totalExtraPeople).toBe(3); // 1 (Margot) + 2 (visitas)
  });
});

// ─────────────────────────────────────────────
// CASOS INVÁLIDOS — deben retornar null
// ─────────────────────────────────────────────

describe('utilityParser — retorna null', () => {
  test('sin Consumo() → null', () => {
    expect(parseUtilityCommentary('Luz enero 2026', MOCK_COST, MOCK_DATE)).toBeNull();
  });

  test('texto vacío → null', () => {
    expect(parseUtilityCommentary('', MOCK_COST, MOCK_DATE)).toBeNull();
  });

  test('sin periodo de fechas → null', () => {
    expect(parseUtilityCommentary('Consumo(79 Kw)', MOCK_COST, MOCK_DATE)).toBeNull();
  });
});
