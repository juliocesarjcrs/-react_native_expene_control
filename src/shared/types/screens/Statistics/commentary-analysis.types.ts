// Types para análisis de comentarios

export type AnalysisType = 'utilities' | 'products' | 'retention';

// Parseo de servicios públicos
export interface UtilityConsumption {
  cost: number;
  consumption: number; // Kw, M3, unidades
  unit: 'Kw' | 'M3' | 'unidad';
  periodStart: string;
  periodEnd: string;
  notes?: string; // "Con Margot", "Deshabitado X días"
  date: string;
  hasExtraPerson?: boolean;
  uninhabitedDays?: number;
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
