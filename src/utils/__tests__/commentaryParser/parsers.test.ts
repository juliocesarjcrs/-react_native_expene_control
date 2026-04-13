/**
 * parsers.test.ts
 * Ubicación: src/utils/__tests__/commentaryParser/parsers.test.ts
 *
 * Tests de transport, familyAid, nutrition, sports y rent
 * con datos reales de la BD.
 */

import { parseTransportCommentary } from '~/utils/commentaryParser/transportParser';
import { parseFamilyAidCommentary } from '~/utils/commentaryParser/familyAidParser';
import { parseNutritionCommentary } from '~/utils/commentaryParser/nutritionParser';
import { parseSportsCommentary } from '~/utils/commentaryParser/sportsParser';
import { parseRentCommentary } from '~/utils/commentaryParser/rentParser';

const MOCK_DATE = '2026-03-09';

// ─────────────────────────────────────────────
// TRANSPORT
// ─────────────────────────────────────────────

describe('transportParser — datos reales', () => {
  test('trayecto simple con "a"', () => {
    const r = parseTransportCommentary('Villa Verde a Centro', 8000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.origin).toBeTruthy();
    expect(r!.destination).toBeTruthy();
    expect(r!.isRoundTrip).toBe(false);
    expect(r!.passengerCount).toBe(1);
  });

  test('ida y vuelta aeropuerto', () => {
    const r = parseTransportCommentary(
      'Ida y vuelta Villa Verde a Balneario Termales Santa Rosa',
      92000,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.isRoundTrip).toBe(true);
  });

  test('múltiples pasajes', () => {
    const r = parseTransportCommentary('2 pasajes Pereira - El Cedral', 34000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.passengerCount).toBe(2);
  });

  test('recarga Megabus', () => {
    const r = parseTransportCommentary('Recarga 4 pasajes Megabus', 15000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.passengerCount).toBe(4);
    expect(r!.origin).toBe('Recarga');
  });

  test('trayecto Dian a oval', () => {
    const r = parseTransportCommentary('Carro Dian a oval', 12000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.destination).toMatch(/oval/i);
  });
});

// ─────────────────────────────────────────────
// FAMILY AID
// ─────────────────────────────────────────────

describe('familyAidParser — datos reales', () => {
  test('ayuda bimensual con número de secuencia (id: 49968 adaptado)', () => {
    const r = parseFamilyAidCommentary(
      'Ayuda bimensual a Papá Jairo Mar-Abr 2026 #9',
      67000,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.person).toContain('Jairo');
    expect(r!.periodicity).toBe('bimensual');
    expect(r!.months).toEqual(['Mar', 'Abr']);
    expect(r!.year).toBe(2026);
    expect(r!.sequenceNumber).toBe(9);
    expect(r!.paymentType).toBe('completo');
  });

  test('saldo de ayuda bimensual', () => {
    const r = parseFamilyAidCommentary(
      'Saldo de Ayuda bimensual a Papá Jairo Ene-Feb 2026 #8',
      67000,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.paymentType).toBe('saldo');
    expect(r!.months).toEqual(['Ene', 'Feb']);
    expect(r!.sequenceNumber).toBe(8);
  });

  test('ayuda mensual', () => {
    const r = parseFamilyAidCommentary('Ayuda mensual a Mamá Mar 2026 #1', 50000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.periodicity).toBe('mensual');
    expect(r!.months).toHaveLength(1);
  });

  test('texto libre sin patrón → null', () => {
    expect(parseFamilyAidCommentary('Activar cuenta Banco Agrario', 0, MOCK_DATE)).toBeNull();
  });
});

// ─────────────────────────────────────────────
// NUTRITION
// ─────────────────────────────────────────────

describe('nutritionParser — datos reales', () => {
  test('semana 6 Natural Body Center', () => {
    const r = parseNutritionCommentary('Semana 6 Natural Body Center', 150000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.weekNumber).toBe(6);
    expect(r!.center).toBe('Natural Body Center');
  });

  test('semana 1', () => {
    const r = parseNutritionCommentary('Semana 1 Natural Body Center', 150000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.weekNumber).toBe(1);
  });

  test('semana con nota adicional', () => {
    const r = parseNutritionCommentary(
      'Semana 4 Natural Body Center - sesión inicial',
      150000,
      MOCK_DATE
    );
    expect(r).not.toBeNull();
    expect(r!.notes).toBe('sesión inicial');
  });

  test('Flora liv (suplemento libre) → null', () => {
    expect(parseNutritionCommentary('Flora liv', 35000, MOCK_DATE)).toBeNull();
  });
});

// ─────────────────────────────────────────────
// SPORTS
// ─────────────────────────────────────────────

describe('sportsParser — datos reales', () => {
  test('mensualidad con mes y deporte', () => {
    const r = parseSportsCommentary('Mensualidad Feb (futsal)', 80000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.expenseType).toBe('mensualidad');
    expect(r!.month).toBe('Feb');
    expect(r!.sport).toBe('futsal');
  });

  test('arbitraje', () => {
    const r = parseSportsCommentary('Arbitraje Futsal Amistoso', 30000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.expenseType).toBe('arbitraje');
    expect(r!.sport).toBe('futsal');
  });

  test('cancha con lugar y deporte', () => {
    const r = parseSportsCommentary('Cancha Canaan futbol 8', 50000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.expenseType).toBe('cancha');
    expect(r!.location).toBe('Canaan');
  });

  test('uniforme equipamiento', () => {
    const r = parseSportsCommentary('Uniforme ProSport Futsal', 120000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.expenseType).toBe('equipamiento');
  });
});

// ─────────────────────────────────────────────
// RENT
// ─────────────────────────────────────────────

describe('rentParser — datos reales', () => {
  test('días parciales con mes explícito', () => {
    const r = parseRentCommentary('22 días mes Febrero 2026', 250000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.paymentType).toBe('parcial');
    expect(r!.days).toBe(22);
    expect(r!.month).toBe('Febrero');
    expect(r!.year).toBe(2026);
  });

  test('días parciales con propiedad', () => {
    const r = parseRentCommentary('9 días arriendo Torre 2. Apt 505', 150000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.paymentType).toBe('parcial');
    expect(r!.days).toBe(9);
    expect(r!.property).toContain('Torre');
  });

  test('nuevo valor del canon', () => {
    const r = parseRentCommentary('Nuevo valor apt 1004 Mirador Villa Verde', 800000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.paymentType).toBe('nuevo_valor');
    expect(r!.isNewValue).toBe(true);
    expect(r!.property).toContain('1004');
  });

  test('arriendo mes completo', () => {
    const r = parseRentCommentary('Arriendo Marzo 2026', 1200000, MOCK_DATE);
    expect(r).not.toBeNull();
    expect(r!.paymentType).toBe('completo');
  });

  test('texto sin patrón → null', () => {
    expect(parseRentCommentary('Tapón lavadero', 15000, MOCK_DATE)).toBeNull();
  });
});
