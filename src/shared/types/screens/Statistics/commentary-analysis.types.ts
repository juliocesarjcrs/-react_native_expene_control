// Types para análisis de comentarios

export type AnalysisType = 'utilities' | 'products' | 'retention';

// Parseo de servicios públicos
export interface UtilityConsumption {
  // Datos básicos (obligatorios)
  cost: number;
  consumption: number;
  unit: 'Kw' | 'M3';
  periodStart: string; // "18 Dic"
  periodEnd: string; // "17 Ene 2026"
  date: string; // ISO date string

  // Situación base
  isSolo: boolean; // true si tiene [Solos]

  // Persona adicional
  hasExtraPerson: boolean;
  extraPersonName?: string; // "Margot"
  extraPersonStartDate?: string; // "10 Abr"
  extraPersonEndDate?: string; // "17 May"

  // Visitas puntuales
  hasVisits: boolean;
  visitsCount?: number; // 1, 2, 3, 4...
  visitsSingleName?: string; // "Monica" - solo si es 1 visita
  visitsDescription?: string; // "Familia Silvia 17-19 Ago"

  // Deshabitado
  uninhabitedDays?: number;
  uninhabitedReason?: string; // "Semana Santa", "Viaje Valledupar"

  // Cálculo automático
  totalExtraPeople: number; // Suma automática: persona adicional (1) + visitas (N)

  // Notas para franja gris (calculadas automáticamente)
  notesForDisplay?: string; // Texto combinado para mostrar en franja gris
}

export interface ConsumptionStats {
  alone: number; // Consumo promedio solos
  withExtra: number; // Consumo promedio con persona adicional
  difference: number; // Diferencia absoluta
  percentageIncrease: number; // Porcentaje de aumento
  aloneCount: number; // Cantidad de registros solos
  withExtraCount: number; // Cantidad de registros con persona
}

// Parseo de productos
export interface ProductPrice {
  cost: number;
  product: string;
  quantity: number; // kg
  pricePerKg: number;
  store?: string;
  date: string;
}

// Parseo de retenciones
export interface RetentionData {
  cost: number;
  retention: number; // monto retenido
  notes?: string;
  date: string;
  category: string;
}

// Patrones para parsear comentarios
export interface CommentaryPattern {
  id: string;
  name: string;
  regex: RegExp;
  parser: (commentary: string) => any;
  example: string;
}
