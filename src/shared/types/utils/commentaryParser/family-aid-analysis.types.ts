/**
 * Tipos para el parser de comentarios de ayuda familiar
 * Ubicación: src/shared/types/utils/commentaryParser/family-aid-analysis.types.ts
 *
 * Formato soportado:
 *   Ayuda {periodicidad} a {Persona} {Mes1}-{Mes2} #{N}     (bimensual)
 *   Ayuda {periodicidad} a {Persona} {Mes} #{N}             (mensual)
 *   Saldo Ayuda {periodicidad} a {Persona} {Mes1}-{Mes2} #{N}
 *   Abono Ayuda {periodicidad} a {Persona} ...
 *
 * Ejemplos reales:
 *   "Ayuda bimensual a Papá Jairo Mar-Abr 2026 #9"
 *   "Saldo de Ayuda bimensual a Papá Jairo Ene-Feb 2026 #8"
 */

export type FamilyAidPeriodicity = 'mensual' | 'bimensual' | 'trimestral' | 'otro';
export type FamilyAidPaymentType = 'completo' | 'abono' | 'saldo';

export interface FamilyAidData {
  cost: number;
  date: string;

  person: string; // "Papá Jairo"
  periodicity: FamilyAidPeriodicity;

  paymentType: FamilyAidPaymentType; // completo | abono | saldo
  sequenceNumber?: number; // El #N del comentario

  // Período cubierto
  months: string[]; // ["Mar", "Abr"] o ["Ene"]
  year?: number; // 2026

  notes?: string;
}
