/**
 * Tipos para el parser de copagos médicos
 * Ubicación: src/shared/types/utils/commentaryParser/copago-analysis.types.ts
 *
 * Formato estándar:
 *   Copago {Institución} {servicio} #{N}/{Total}
 *   Copago {Institución} {servicio}              ← consulta única sin sesión
 *   Copago {servicio} #{N}/{Total}               ← sin institución
 *
 * Ejemplos:
 *   "Copago Colmedica terapia física #11/20"
 *   "Copago Colmedica consulta neurología"
 *   "Copago fisiatría #1/10"
 */

export type CopagoServiceType =
  | 'terapia_fisica'
  | 'terapia_ocupacional'
  | 'consulta'
  | 'control'
  | 'psicologia'
  | 'psiquiatra'
  | 'fisiatria'
  | 'neurocirugia'
  | 'otro';

export interface CopagoData {
  cost: number;
  date: string;

  institution?: string; // "Colmedica", "Salud Total" — undefined si no se menciona
  service: string; // "terapia física", "consulta neurología"
  serviceType: CopagoServiceType; // clasificación normalizada

  // Sesión (solo si el comentario incluye #N/Total)
  sessionNumber?: number; // 11
  totalSessions?: number; // 20
  hasSessions: boolean; // true si tiene #N/Total
}

export interface CopagoSessionStats {
  service: string;
  institution?: string;
  completedSessions: number;
  totalSessions: number; // del último registro con total conocido
  progressPercent: number; // completedSessions / totalSessions * 100
  totalCost: number;
  avgCostPerSession: number;
}
