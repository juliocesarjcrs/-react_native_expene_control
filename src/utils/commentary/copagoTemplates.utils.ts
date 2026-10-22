/**
 * Plantillas (chips) y validación de comentarios de copagos médicos
 * Ubicación: src/utils/commentary/copagoTemplates.utils.ts
 *
 * Mismo patrón que assetTemplates.utils.ts. Los chips son texto real y
 * parseable (sin placeholders): templateChipSync.test los valida contra el parser.
 *
 * La validación llama al parser: es seguro porque copagoParser solo importa
 * tipos y el catálogo, nunca el índice ni el registry (sin dependencia circular).
 */

import {
  SubcategoryTemplateConfig,
  TemplateChip,
  CommentaryValidationResult
} from '~/shared/types/screens/settings/commentary-templates.types';
import { parseCopagoCommentary } from '~/utils/commentaryParser/copagoParser';
import { COPAGO_FORMAT_EXAMPLE } from '~/utils/commentaryParser/copagoCatalog';

export const COPAGO_CHIPS: TemplateChip[] = [
  {
    label: 'Consulta',
    icon: 'doctor',
    template: 'Colmedica Consulta Neurología',
    hint: 'Cita de especialidad. Si es la primera vez agrega #1 (cuenta citas por especialidad)'
  },
  {
    label: 'Control',
    icon: 'clipboard-check',
    template: 'Colmedica Control Reumatología #2',
    hint: '#N = número de cita de esa especialidad (la primera vez es #1, el primer control #2)'
  },
  {
    label: 'Terapia',
    icon: 'run',
    template: 'Colmedica Terapia Física #1/20',
    hint: 'Terapia con sesión sobre total. Al empezar otro ciclo vuelve a #1/Total. Psicología va abierta: #4'
  },
  {
    label: 'Examen',
    icon: 'radiology-box',
    template: 'Colmedica Examen Gammagrafía ósea',
    hint: 'Imágenes y otros exámenes. Un examen por gasto'
  },
  {
    label: 'Laboratorio',
    icon: 'test-tube',
    template: 'Salud Total Laboratorio Sangre',
    hint: 'Laboratorio en sede física. Si vino a la casa usa Domicilio'
  },
  {
    label: 'Medicamentos',
    icon: 'pill',
    template: 'Salud Total Medicamentos @Julio',
    hint: 'Sin @ se asume Silvia. Para Julio escribe @Julio'
  },
  {
    label: 'Domicilio',
    icon: 'home-heart',
    template: 'Domicilio Laboratorio',
    hint: 'Atención o toma de muestra en casa. Agrega detalles con " - nota"'
  }
];

export const buildCopagoConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'structured',
  parserType: 'copago',
  chips: COPAGO_CHIPS,
  smartPlaceholder: `Ej: ${COPAGO_FORMAT_EXAMPLE}`,
  enableValidation: true
});

export const validateCopagoCommentary = (text: string): CommentaryValidationResult => {
  if (parseCopagoCommentary(text, 0, '') !== null) return { state: 'valid' };
  return {
    state: 'warning',
    message:
      'Empieza con el acto: Consulta, Control, Terapia, Urgencia, Examen, Laboratorio, Medicamentos, Procedimiento o Domicilio'
  };
};
