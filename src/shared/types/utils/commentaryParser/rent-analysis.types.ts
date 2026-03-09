/**
 * Tipos para el parser de comentarios de arriendo
 * Ubicación: src/shared/types/utils/commentaryParser/rent-analysis.types.ts
 *
 * Formatos soportados:
 *   {N} días arriendo {descripcion}
 *   Arriendo {mes} {descripcion}
 *   Nuevo valor {descripcion}
 *
 * Ejemplos reales:
 *   "9 días arriendo Torre 2. Apt 505"
 *   "22 días mes Febrero 2026"
 *   "Nuevo valor apt 1004 Mirador Villa Verde"
 */

export type RentPaymentType =
  | 'completo' // Mes completo
  | 'parcial' // N días (mudanza, salida anticipada)
  | 'nuevo_valor'; // Registro de cambio de canon

export interface RentData {
  cost: number;
  date: string;

  paymentType: RentPaymentType;
  days?: number; // Para pagos parciales: 9, 22
  month?: string; // "Febrero"
  year?: number; // 2026
  property?: string; // "Torre 2. Apt 505", "apt 1004 Mirador Villa Verde"
  isNewValue?: boolean; // true si es registro de cambio de canon

  notes?: string;
}
