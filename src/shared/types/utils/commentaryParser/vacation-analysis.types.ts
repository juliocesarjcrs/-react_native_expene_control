/**
 * Tipos para el parser de vacaciones
 * Ubicación: src/shared/types/utils/commentaryParser/vacation-analysis.types.ts
 *
 * Soporta tres subtipos:
 *   - Alojamiento: Hotel, Airbnb, Hostal, Cabaña, etc.
 *   - Tiquete: vuelos con aerolínea, origen, destino, pasajeros
 *   - Gasto suelto: {Destino}: {descripción libre}
 */

export type VacationExpenseType = 'lodging' | 'flight' | 'expense';

export type LodgingModality =
  | 'todo_incluido'
  | 'con_desayuno'
  | 'media_pension'
  | 'solo_alojamiento'
  | 'solo_habitacion'
  | 'otro';

// ─────────────────────────────────────────────
// ALOJAMIENTO
// ─────────────────────────────────────────────

export interface VacationLodging {
  type: 'lodging';
  cost: number;
  date: string;
  destination: string;

  lodgingType: string; // "Hotel", "Airbnb", "Hostal", "Cabaña"
  name: string; // "Cartagena Plaza", "Sector El Cable"
  nights: number; // 4
  modality: LodgingModality;

  // Desglose de tarifa (opcional)
  baseFare?: number; // 428.618 — tarifa base sin impuestos
  taxes?: number; // 87.037 — impuestos y tasas

  // Calculados automáticamente
  pricePerNight: number; // cost / nights
  baseFarePerNight?: number; // baseFare / nights (para comparar sin impuestos)
}

// ─────────────────────────────────────────────
// TIQUETE
// ─────────────────────────────────────────────

export interface VacationFlight {
  type: 'flight';
  cost: number;
  date: string;
  destination: string; // destino final del viaje

  airline: string; // "Avianca", "Latam"
  origin: string; // "Pereira"
  passengers: number; // 2

  // Fechas del viaje (opcionales)
  departureDate?: string; // "11 Oct"
  returnDate?: string; // "14 Oct"

  // Calculado automáticamente
  pricePerPerson: number; // cost / passengers
}

// ─────────────────────────────────────────────
// GASTO SUELTO
// ─────────────────────────────────────────────

export interface VacationExpense {
  type: 'expense';
  cost: number;
  date: string;
  destination: string; // extraído del prefijo "Destino: ..."

  description: string; // lo que sigue después del destino
}

// ─────────────────────────────────────────────
// UNION
// ─────────────────────────────────────────────

export type VacationData = VacationLodging | VacationFlight | VacationExpense;

// ─────────────────────────────────────────────
// ESTADÍSTICAS
// ─────────────────────────────────────────────

export interface VacationDestinationSummary {
  destination: string;
  totalCost: number;
  lodgingCost: number;
  flightCost: number;
  expenseCost: number;
  lodgingCount: number;
  flightCount: number;
  expenseCount: number;
}

export interface LodgingComparison {
  lodgingType: string;
  name: string;
  destination: string;
  nights: number;
  pricePerNight: number;
  baseFarePerNight?: number;
  modality: LodgingModality;
  date: string;
}
