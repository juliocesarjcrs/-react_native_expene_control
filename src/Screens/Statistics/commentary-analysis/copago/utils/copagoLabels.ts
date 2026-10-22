/**
 * Textos de presentación para items de copago
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/utils/copagoLabels.ts
 */

import { CopagoData } from '~/shared/types/utils/commentaryParser/copago-analysis.types';
import { ACT_LABELS, DEFAULT_PATIENT } from '~/utils/commentaryParser';

/** "Colmedica · Control Reumatología" */
export const getItemTitle = (item: CopagoData): string => {
  const base = `${ACT_LABELS[item.act]}${item.area ? ` ${item.area}` : ''}`;
  return item.institution ? `${item.institution} · ${base}` : base;
};

/** Terapia → "Sesión 5/20"; resto → "Cita #2"; sin número → undefined */
export const getSequenceLabel = (item: CopagoData): string | undefined => {
  if (!item.hasSequence) return undefined;
  if (item.sequenceKind === 'session') {
    return `Sesión ${item.sequenceNumber}${item.totalSessions ? `/${item.totalSessions}` : ''}`;
  }
  return `Cita #${item.sequenceNumber}`;
};

/** Solo se muestra cuando no es el paciente por defecto */
export const getPatientBadge = (item: CopagoData): string | undefined =>
  item.patient !== DEFAULT_PATIENT ? item.patient : undefined;
