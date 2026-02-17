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
  // — Campos base —
  cost: number; // Costo total pagado (siempre disponible)
  product: string; // Nombre del producto parseado
  quantity: number; // Cantidad en kg o unidades
  pricePerKg: number; // Precio por kg / precio por unidad (con descuento si aplica)
  date: string; // Fecha del gasto (YYYY-MM-DD)

  // — Campos opcionales —
  store?: string; // Tienda donde se compró [Carulla], [D1], etc.
  unit?: 'kg' | 'un'; // Unidad de medida explícita

  // — Descuento (cuando el comentario incluye "antes $X/kg, -Y%") —
  originalPricePerKg?: number; // Precio antes del descuento
  discountPercent?: number; // Porcentaje de descuento (ej: 30)

  // — Flags de calidad del dato —
  isWeighed?: boolean; // true = se vende por peso (kg), false = por unidad
  isIncomplete?: boolean; // true = el comentario no tenía kg ni precio → dato parcial
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
