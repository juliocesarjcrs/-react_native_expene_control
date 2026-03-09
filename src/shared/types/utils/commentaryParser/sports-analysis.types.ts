/**
 * Tipos para el parser de comentarios de deportes
 * Ubicación: src/shared/types/utils/commentaryParser/sports-analysis.types.ts
 *
 * Formatos soportados:
 *   Mensualidad {Mes} ({deporte})
 *   Arbitraje {descripción}
 *   Cancha {lugar} {deporte}
 *   {ítem} {deporte/equipo}     ← ropa, accesorios
 *
 * Ejemplos reales:
 *   "Mensualidad Feb (futsal)"
 *   "Arbitraje Futsal Amistoso"
 *   "Cancha Canaan futbol 8"
 *   "Uniforme ProSport Futsal"
 */

export type SportsExpenseType =
  | 'mensualidad' // Cuota mensual a club/academia
  | 'arbitraje' // Pago de árbitro
  | 'cancha' // Alquiler de cancha
  | 'equipamiento' // Ropa, zapatos, uniforme
  | 'otro';

export interface SportsData {
  cost: number;
  date: string;

  expenseType: SportsExpenseType;
  sport?: string; // "futsal", "futbol 8"
  month?: string; // Para mensualidades: "Feb"
  location?: string; // Para canchass: "Canaan"
  description: string; // Texto descriptivo limpio
}
