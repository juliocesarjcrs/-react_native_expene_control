/**
 * copagoParser.test.ts
 * Ubicación: src/utils/__tests__/commentaryParser/copagoParser.test.ts
 *
 * Tests con comentarios reales de la BD (subcategoría "Cuota moderadora").
 */

import { parseCopagoCommentary } from '~/utils/commentaryParser/copagoParser';

const MOCK_COST = 43900;
const MOCK_DATE = '2026-03-17';

describe('copagoParser — casos válidos', () => {
  test('terapia con institución y número de sesión', () => {
    const r = parseCopagoCommentary('Copago Colmedica terapia #11 /20', MOCK_COST, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.institution).toBe('Colmedica');
    expect(r!.service).toBe('terapia');
    expect(r!.sessionNumber).toBe(11);
    expect(r!.totalSessions).toBe(20);
    expect(r!.hasSessions).toBe(true);
  });

  test('consulta especialidad sin sesión', () => {
    const r = parseCopagoCommentary('Copago Colmedica consulta neurologia', MOCK_COST, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.institution).toBe('Colmedica');
    expect(r!.service).toBe('consulta neurologia');
    expect(r!.hasSessions).toBe(false);
    expect(r!.serviceType).toBe('consulta');
  });

  test('control psiquiatra con número', () => {
    const r = parseCopagoCommentary(
      'Copago Colmedica control psiquiatra # 2',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.sessionNumber).toBe(2);
    expect(r!.serviceType).toBe('psiquiatra');
  });

  test('sin institución', () => {
    const r = parseCopagoCommentary('Copago cita fisiatria', MOCK_COST, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.institution).toBeUndefined();
    expect(r!.serviceType).toBe('fisiatria');
  });

  test('terapia física — clasifica serviceType correcto', () => {
    const r = parseCopagoCommentary('Copago Colmedica terapia física #18/20', MOCK_COST, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.serviceType).toBe('terapia_fisica');
  });

  test('terapia ocupacional', () => {
    const r = parseCopagoCommentary(
      'Copago Colmedica terapia Ocupacional #4 /10',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.serviceType).toBe('terapia_ocupacional');
    expect(r!.sessionNumber).toBe(4);
    expect(r!.totalSessions).toBe(10);
  });

  test('múltiples copagos — toma solo la primera línea', () => {
    const r = parseCopagoCommentary(
      'Copago terapia # 2 ocupacional\nCopago Colmedica terapia #18-19 /20',
      MOCK_COST,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.sessionNumber).toBe(2);
  });

  test('costo y fecha se preservan', () => {
    const r = parseCopagoCommentary('Copago Colmedica terapia física #1/20', 43900, '2026-03-17');
    expect(r).not.toBeNull();
    expect(r!.cost).toBe(43900);
    expect(r!.date).toBe('2026-03-17');
  });
});

describe('copagoParser — retorna null', () => {
  test('formato antiguo sin "Copago" → null', () => {
    expect(
      parseCopagoCommentary('# 1/ 10 terapia fisica fisiatria', MOCK_COST, MOCK_DATE)
    ).toBeNull();
  });

  test('cuota medicina en casa → null (no tiene Copago)', () => {
    expect(parseCopagoCommentary('Cuota Medicina en Casa', MOCK_COST, MOCK_DATE)).toBeNull();
  });

  test('texto vacío → null', () => {
    expect(parseCopagoCommentary('', MOCK_COST, MOCK_DATE)).toBeNull();
  });
});
