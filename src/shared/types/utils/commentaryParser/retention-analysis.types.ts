// — Primas con retención separada —
// Ej: "Prima nav: 609.000" | "Prima gest: 1.555.000"
export interface PrimaRetention {
  type: string; // "nav", "gest", "jun", "bonif" — lo que escriba el usuario
  label: string; // Capitalizado para mostrar: "Nav", "Gest", etc.
  amount: number; // Monto retenido de esa prima
}

// — Incapacidad del mes —
// Prim: días 1-2 que paga el empleador al 100% (sin descuento económico)
// Eps:  días 3+  que paga la EPS al 66.67% (el 33.33% es pérdida)
export interface IncapacidadData {
  primDays: number; // Total días primeros (códigos 2040) — sin pérdida económica
  epsDays: number; // Total días EPS (códigos 2016) — con pérdida del 33.33%
  totalDays: number; // primDays + epsDays

  // Calculado automáticamente si se conoce el salario base
  dailySalary?: number; // salarioBase / 30
  discountPerDay?: number; // dailySalary * 0.3333
  totalDiscount?: number; // discountPerDay * epsDays
}

// Parseo de retenciones de nómina
export interface RetentionData {
  cost: number;
  retention: number; // Retefuente ordinaria (salario)
  date: string;
  category: string;

  // — Nuevos campos —
  primas?: PrimaRetention[]; // Retenciones de primas del mismo recibo
  totalPrimasRetention?: number; // Suma de todas las primas (calculado)
  totalRetentionWithPrimas?: number; // retention + totalPrimasRetention (calculado)

  incapacidad?: IncapacidadData; // Datos de incapacidad del mes

  notes?: string;
}

// Estadísticas de incapacidad en un período
export interface IncapacidadStats {
  totalPrimDays: number;
  totalEpsDays: number;
  totalDays: number;
  totalDiscount: number; // Pérdida económica total por incapacidad EPS
  monthsWithIncapacidad: number;
  avgEpsDaysPerMonth: number; // Promedio días EPS por mes afectado
}
