/**
 * vacationParser.test.ts
 * Ubicación: src/utils/__tests__/commentaryParser/vacationParser.test.ts
 *
 * Tests con comentarios reales de la BD (subcategoría "Vacaciones").
 * IDs reales: 46027, 49381, 49564, 49610, 51958, 51959, etc.
 */

import { parseVacationCommentary } from '~/utils/commentaryParser/vacationParser';
import {
  VacationLodging,
  VacationFlight,
  VacationExpense
} from '~/shared/types/utils/commentaryParser/vacation-analysis.types';

const MOCK_DATE = '2026-03-15';

// ─────────────────────────────────────────────
// ALOJAMIENTO
// ─────────────────────────────────────────────

describe('vacationParser — alojamiento', () => {
  test('hotel todo incluido (id: 46027)', () => {
    const r = parseVacationCommentary(
      'Alojamiento Hotel Cartagena Plaza 4 noches [Todo incluido] [Cartagena]',
      3374657,
      MOCK_DATE
    ) as VacationLodging;
    expect(r).not.toBeNull();
    expect(r.type).toBe('lodging');
    expect(r.lodgingType).toBe('Hotel');
    expect(r.name).toBe('Cartagena Plaza');
    expect(r.nights).toBe(4);
    expect(r.modality).toBe('todo_incluido');
    expect(r.destination).toBe('Cartagena');
    expect(r.pricePerNight).toBe(Math.round(3374657 / 4));
  });

  test('airbnb solo habitación (id: 51959)', () => {
    const r = parseVacationCommentary(
      'Alojamiento Airbnb Sector El Cable 3 noches [Solo habitación] [Manizales]',
      398519,
      MOCK_DATE
    ) as VacationLodging;
    expect(r).not.toBeNull();
    expect(r.type).toBe('lodging');
    expect(r.lodgingType).toBe('Airbnb');
    expect(r.nights).toBe(3);
    expect(r.modality).toBe('solo_habitacion');
    expect(r.destination).toBe('Manizales');
  });

  test('hotel con desglose tarifa e impuestos (id: 51958)', () => {
    const r = parseVacationCommentary(
      'Alojamiento Hotel Termales del Otoño 1 noche [Solo alojamiento] [Santa Rosa]\nTarifa: 428.618\nImpuestos: 87.037',
      515655,
      MOCK_DATE
    ) as VacationLodging;
    expect(r).not.toBeNull();
    expect(r.baseFare).toBe(428618);
    expect(r.taxes).toBe(87037);
    expect(r.baseFarePerNight).toBe(428618);
    expect(r.pricePerNight).toBe(515655);
  });

  test('1 noche calcula pricePerNight igual al costo', () => {
    const r = parseVacationCommentary(
      'Alojamiento Hotel Termales Tierra Viva 1 noche [Con desayuno] [Manizales]',
      190000,
      MOCK_DATE
    ) as VacationLodging;
    expect(r).not.toBeNull();
    expect(r.pricePerNight).toBe(190000);
  });
});

// ─────────────────────────────────────────────
// TIQUETES
// ─────────────────────────────────────────────

describe('vacationParser — tiquetes', () => {
  test('tiquete Avianca con fechas (id: 49381)', () => {
    const r = parseVacationCommentary(
      'Tiquete Avianca Pereira-Valledupar 2 pasajeros [11 Oct-14 Oct]',
      1385400,
      MOCK_DATE
    ) as VacationFlight;
    expect(r).not.toBeNull();
    expect(r.type).toBe('flight');
    expect(r.airline).toBe('Avianca');
    expect(r.origin).toBe('Pereira');
    expect(r.destination).toBe('Valledupar');
    expect(r.passengers).toBe(2);
    expect(r.pricePerPerson).toBe(Math.round(1385400 / 2));
    expect(r.departureDate).toBe('11 Oct');
    expect(r.returnDate).toBe('14 Oct');
  });

  test('tiquete Latam (id: 49564)', () => {
    const r = parseVacationCommentary(
      'Tiquete Latam Pereira-Santa Marta 2 pasajeros [15 Nov-18 Nov]',
      1500160,
      MOCK_DATE
    ) as VacationFlight;
    expect(r).not.toBeNull();
    expect(r.airline).toBe('Latam');
    expect(r.destination).toBe('Santa Marta');
    expect(r.pricePerPerson).toBe(Math.round(1500160 / 2));
  });
});

// ─────────────────────────────────────────────
// GASTOS SUELTOS — formato estándar con ":"
// ─────────────────────────────────────────────

describe('vacationParser — gastos sueltos formato estándar', () => {
  test('gasto con dos puntos', () => {
    const r = parseVacationCommentary(
      'Santa Marta: 2 sándwich Juan Valdez',
      35800,
      MOCK_DATE
    ) as VacationExpense;
    expect(r).not.toBeNull();
    expect(r.type).toBe('expense');
    expect(r.destination).toBe('Santa Marta');
    expect(r.description).toBe('2 sándwich Juan Valdez');
  });

  test('gasto Curazao con moneda extranjera', () => {
    const r = parseVacationCommentary(
      'Curazao: Galletas holandesas 10 USD',
      38491,
      MOCK_DATE
    ) as VacationExpense;
    expect(r).not.toBeNull();
    expect(r.destination).toBe('Curazao');
  });
});

// ─────────────────────────────────────────────
// GASTOS SUELTOS — compatibilidad histórica (sin ":")
// ─────────────────────────────────────────────

describe('vacationParser — compatibilidad datos históricos', () => {
  test('Santa Marta sin dos puntos (id: 50421)', () => {
    const r = parseVacationCommentary(
      'Santa Marta 51 mil 3 arepas',
      91000,
      MOCK_DATE
    ) as VacationExpense;
    expect(r).not.toBeNull();
    expect(r.type).toBe('expense');
    expect(r.destination).toMatch(/Santa Marta/i);
  });

  test('Valledupar sin dos puntos (id: 49963)', () => {
    const r = parseVacationCommentary('Valledupar taxi', 10000, MOCK_DATE) as VacationExpense;
    expect(r).not.toBeNull();
    expect(r.destination).toMatch(/Valledupar/i);
    expect(r.description).toBe('taxi');
  });

  test('Barranquilla sin dos puntos (id: 50418)', () => {
    const r = parseVacationCommentary(
      'Barranquilla 6 arepas Valle',
      26000,
      MOCK_DATE
    ) as VacationExpense;
    expect(r).not.toBeNull();
    expect(r.destination).toMatch(/Barranquilla/i);
  });
});

// ─────────────────────────────────────────────
// CASOS QUE RETORNAN NULL
// ─────────────────────────────────────────────

describe('vacationParser — retorna null', () => {
  test('comentario sin destino reconocido → null', () => {
    expect(parseVacationCommentary('Propina', 4000, MOCK_DATE)).toBeNull();
  });

  test('texto vacío → null', () => {
    expect(parseVacationCommentary('', 0, MOCK_DATE)).toBeNull();
  });
});
