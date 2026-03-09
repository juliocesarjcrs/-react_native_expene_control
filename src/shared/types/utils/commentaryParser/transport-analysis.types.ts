/**
 * Tipos para el parser de comentarios de transporte
 * Ubicación: src/shared/types/utils/commentaryParser/transport-analysis.types.ts
 *
 * Formato soportado:
 *   {Origen} a {Destino}
 *   Ida y vuelta {Origen} a {Destino}
 *   2 pasajes {Origen} a {Destino}
 */

export interface TransportData {
  cost: number;
  date: string;

  origin: string; // "Villa Verde"
  destination: string; // "Centro"

  isRoundTrip: boolean; // true si dice "Ida y vuelta" o "ida y vuelta"
  passengerCount: number; // 1 por defecto, 2+ si dice "2 pasajes", "3 personas", etc.

  notes?: string; // Cualquier texto adicional no reconocido
}
