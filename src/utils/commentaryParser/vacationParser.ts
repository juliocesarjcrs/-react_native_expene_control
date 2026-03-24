/**
 * Parser de comentarios de vacaciones
 * Ubicación: src/utils/commentaryParser/vacationParser.ts
 *
 * Formatos soportados:
 *
 * 1. Alojamiento:
 *    Alojamiento {Tipo} {Nombre} {N} noche(s) [{Modalidad}] [{Destino}]
 *    Tarifa: 428.618          ← opcional, línea 2
 *    Impuestos: 87.037        ← opcional, línea 3
 *
 * 2. Tiquete:
 *    Tiquete {Aerolínea} {Origen}-{Destino} {N} pasajeros [{DD Mes}-{DD Mes}]
 *
 * 3. Gasto suelto:
 *    {Destino}: {descripción libre}
 *    {Destino} {descripción libre}   ← sin dos puntos (compatibilidad datos históricos)
 */

import {
  VacationData,
  VacationLodging,
  VacationFlight,
  VacationExpense,
  LodgingModality,
  VacationDestinationSummary,
  LodgingComparison
} from '~/shared/types/utils/commentaryParser/vacation-analysis.types';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const parseColombian = (raw: string): number => parseInt(raw.replace(/[.,\s]/g, '')) || 0;

const MODALITY_MAP: Record<string, LodgingModality> = {
  'todo incluido': 'todo_incluido',
  todo_incluido: 'todo_incluido',
  'con desayuno': 'con_desayuno',
  'incluye desayuno': 'con_desayuno',
  desayuno: 'con_desayuno',
  'media pension': 'media_pension',
  'media pensión': 'media_pension',
  'solo alojamiento': 'solo_alojamiento',
  'solo habitacion': 'solo_habitacion',
  'solo habitación': 'solo_habitacion'
};

const parseModality = (raw: string): LodgingModality => {
  const lower = raw.toLowerCase().trim();
  for (const [key, value] of Object.entries(MODALITY_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'otro';
};

// Destinos conocidos para compatibilidad con datos históricos sin ":"
const KNOWN_DESTINATIONS = [
  'cartagena',
  'santa marta',
  'valledupar',
  'barranquilla',
  'curazao',
  'curazao',
  'manizales',
  'medellín',
  'medellin',
  'bogotá',
  'bogota',
  'cali',
  'pereira',
  'armenia',
  'salento',
  'santa rosa',
  'panamá',
  'panama',
  'ecuador',
  'españa',
  'espana'
];

// ─────────────────────────────────────────────
// REGEX PATTERNS
// ─────────────────────────────────────────────

const PATTERNS = {
  // "Alojamiento Hotel Cartagena Plaza 4 noches [Todo incluido] [Cartagena]"
  lodging: /^alojamiento\s+(\w+)\s+(.+?)\s+(\d+)\s+noches?\s*(.*)?$/i,

  // Líneas de desglose opcionales
  baseFare: /^tarifa\s*:\s*([\d.,]+)/im,
  taxLine: /^impuestos?\s*(?:y\s*tasas?)?\s*:\s*([\d.,]+)/im,

  // Corchetes: [Todo incluido] [Cartagena]
  bracket: /\[([^\]]+)\]/g,

  // "Tiquete Avianca Pereira-Valledupar 2 pasajeros [11 Oct-14 Oct]"
  flight: /^tiquete\s+(\w+)\s+(\w+)-(\w[\w\s]*?)\s+(\d+)\s+pasajero/i,

  // Fechas del tiquete "[11 Oct-14 Oct]"
  flightDates: /\[(\d{1,2}\s+\w+)-(\d{1,2}\s+\w+)\]/i,

  // "{Destino}: {descripción}" — gasto suelto con dos puntos
  expenseWithColon: /^([^:]{3,30}):\s+(.+)$/s
};

// ─────────────────────────────────────────────
// PARSERS ESPECÍFICOS
// ─────────────────────────────────────────────

const parseLodging = (commentary: string, cost: number, date: string): VacationLodging | null => {
  const firstLine = commentary.split('\n')[0];
  const match = firstLine.match(PATTERNS.lodging);
  if (!match) return null;

  const lodgingType = match[1]; // "Hotel", "Airbnb"
  const nights = parseInt(match[3]);
  if (nights <= 0) return null;

  // Extraer corchetes del resto: [Todo incluido] [Cartagena]
  const rest = match[4] ?? '';
  const brackets: string[] = [];
  let bm: RegExpExecArray | null;
  const bracketRegex = /\[([^\]]+)\]/g;
  while ((bm = bracketRegex.exec(rest)) !== null) brackets.push(bm[1]);

  // Nombre: todo lo que está entre el tipo y el número de noches
  // match[2] contiene el nombre
  const name = match[2].trim();

  // Modalidad: primer corchete que no sea un destino largo
  let modality: LodgingModality = 'otro';
  let destination = '';
  for (const b of brackets) {
    const mod = parseModality(b);
    if (mod !== 'otro') {
      modality = mod;
    } else {
      destination = b; // asumimos que el corchete no-modalidad es el destino
    }
  }

  // Desglose de tarifa (líneas opcionales)
  const baseFareMatch = commentary.match(PATTERNS.baseFare);
  const taxMatch = commentary.match(PATTERNS.taxLine);
  const baseFare = baseFareMatch ? parseColombian(baseFareMatch[1]) : undefined;
  const taxes = taxMatch ? parseColombian(taxMatch[1]) : undefined;

  const pricePerNight = Math.round(cost / nights);
  const baseFarePerNight = baseFare ? Math.round(baseFare / nights) : undefined;

  return {
    type: 'lodging',
    cost,
    date,
    destination,
    lodgingType,
    name,
    nights,
    modality,
    baseFare,
    taxes,
    pricePerNight,
    baseFarePerNight
  };
};

const parseFlight = (commentary: string, cost: number, date: string): VacationFlight | null => {
  const firstLine = commentary.split('\n')[0];
  const match = firstLine.match(PATTERNS.flight);
  if (!match) return null;

  const airline = match[1];
  const origin = match[2];
  const destination = match[3].trim();
  const passengers = parseInt(match[4]);

  // Fechas opcionales
  const datesMatch = commentary.match(PATTERNS.flightDates);
  const departureDate = datesMatch?.[1];
  const returnDate = datesMatch?.[2];

  return {
    type: 'flight',
    cost,
    date,
    destination,
    airline,
    origin,
    passengers,
    departureDate,
    returnDate,
    pricePerPerson: Math.round(cost / passengers)
  };
};

const parseExpense = (commentary: string, cost: number, date: string): VacationExpense | null => {
  const firstLine = commentary.split('\n')[0].trim();

  // Formato estándar: "Destino: descripción"
  const colonMatch = firstLine.match(PATTERNS.expenseWithColon);
  if (colonMatch) {
    return {
      type: 'expense',
      cost,
      date,
      destination: colonMatch[1].trim(),
      description: colonMatch[2].trim()
    };
  }

  // Compatibilidad histórica: "Valledupar taxi", "Santa Marta 2 sándwich..."
  const lower = firstLine.toLowerCase();
  for (const dest of KNOWN_DESTINATIONS) {
    if (lower.startsWith(dest)) {
      const description = firstLine
        .slice(dest.length)
        .replace(/^[\s\-:]+/, '')
        .trim();
      if (description) {
        return {
          type: 'expense',
          cost,
          date,
          destination: firstLine.slice(0, dest.length),
          description
        };
      }
    }
  }

  return null;
};

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de un gasto de vacaciones.
 * Intenta en orden: alojamiento → tiquete → gasto suelto.
 * Retorna null si no matchea ningún formato.
 */
export const parseVacationCommentary = (
  commentary: string,
  cost: number,
  date: string
): VacationData | null => {
  if (!commentary?.trim()) return null;

  try {
    return (
      parseLodging(commentary, cost, date) ??
      parseFlight(commentary, cost, date) ??
      parseExpense(commentary, cost, date)
    );
  } catch (error) {
    console.error('Error parsing vacation commentary:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// CALCULADORAS
// ─────────────────────────────────────────────

/** Agrupa gastos por destino con totales por tipo */
export const getDestinationSummaries = (data: VacationData[]): VacationDestinationSummary[] => {
  const map = new Map<string, VacationDestinationSummary>();

  for (const item of data) {
    const dest = item.destination;
    const existing = map.get(dest) ?? {
      destination: dest,
      totalCost: 0,
      lodgingCost: 0,
      flightCost: 0,
      expenseCost: 0,
      lodgingCount: 0,
      flightCount: 0,
      expenseCount: 0
    };

    existing.totalCost += item.cost;
    if (item.type === 'lodging') {
      existing.lodgingCost += item.cost;
      existing.lodgingCount += 1;
    } else if (item.type === 'flight') {
      existing.flightCost += item.cost;
      existing.flightCount += 1;
    } else {
      existing.expenseCost += item.cost;
      existing.expenseCount += 1;
    }

    map.set(dest, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost);
};

/** Lista de alojamientos para comparar precio por noche */
export const getLodgingComparisons = (data: VacationData[]): LodgingComparison[] =>
  data
    .filter((d): d is VacationLodging => d.type === 'lodging')
    .map((d) => ({
      lodgingType: d.lodgingType,
      name: d.name,
      destination: d.destination,
      nights: d.nights,
      pricePerNight: d.pricePerNight,
      baseFarePerNight: d.baseFarePerNight,
      modality: d.modality,
      date: d.date
    }))
    .sort((a, b) => a.pricePerNight - b.pricePerNight);
