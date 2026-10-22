/**
 * Catálogo de vocabulario de copagos médicos (datos puros, sin lógica de parseo)
 * Ubicación: src/utils/commentaryParser/copagoCatalog.ts
 *
 * Única fuente de verdad para: actos, instituciones, pacientes, especialidades,
 * etiquetas e iconos. Lo usan el parser, los chips y las pantallas.
 *
 * Para enseñarle algo nuevo al parser (otra especialidad, otra EPS) se edita
 * SOLO este archivo. Una especialidad que no esté aquí igual se reconoce y se
 * agrupa por su propio texto; el catálogo solo le da etiqueta bonita, icono
 * y une sinónimos ("Hídrica" = "Hidroterapia").
 *
 * NO importar nada de ./index ni de los parsers: lo importa commentaryTemplates.
 */

import type { CopagoAct } from '~/shared/types/utils/commentaryParser/copago-analysis.types';

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────

/** minúsculas, sin tildes, sin espacios en los extremos */
export const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const slugify = (text: string): string =>
  normalizeText(text)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const capitalizeFirst = (text: string): string =>
  text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);

// ─────────────────────────────────────────────
// PACIENTES  (específico del usuario — igual que SUBCATEGORY_PARSER_MAP)
// ─────────────────────────────────────────────

/** Paciente que se asume cuando el comentario no menciona a nadie */
export const DEFAULT_PATIENT = 'Silvia';

/** Nombres que se reconocen sueltos (sin @) en datos históricos */
export const KNOWN_PATIENTS = ['Julio', 'Silvia'];

// ─────────────────────────────────────────────
// ACTOS
// ─────────────────────────────────────────────

/** Clave = palabra normalizada (sin tildes, minúsculas) */
export const ACT_WORDS: Record<string, CopagoAct> = {
  consulta: 'consulta',
  control: 'control',
  terapia: 'terapia',
  urgencia: 'urgencia',
  urgencias: 'urgencia',
  examen: 'examen',
  examenes: 'examen',
  laboratorio: 'laboratorio',
  laboratorios: 'laboratorio',
  medicamento: 'medicamentos',
  medicamentos: 'medicamentos',
  procedimiento: 'procedimiento',
  procedimientos: 'procedimiento',
  domicilio: 'domicilio'
};

/**
 * Palabras que por sí solas implican un acto: "Hidroterapia #5/15", "Psicología #3 @Julio".
 * Solo terapias de sesiones: en una especialidad (neurología…) no se sabe si fue
 * consulta o control, así que ahí el acto es obligatorio.
 */
export const IMPLIED_ACT_WORDS: Record<string, CopagoAct> = {
  hidroterapia: 'terapia',
  psicologia: 'terapia',
  sicologia: 'terapia'
};

/** Actos que describen una cita de especialidad (el área es una especialidad) */
export const SPECIALTY_ACTS: CopagoAct[] = ['consulta', 'control', 'terapia', 'urgencia'];

/** Actos que no tienen sentido sin área ("Consulta" a secas no dice nada) */
export const ACTS_REQUIRING_AREA: CopagoAct[] = ['consulta', 'control', 'terapia'];

/**
 * Actos de "otro tipo de evento": si aparece la palabra "domicilio" en el
 * comentario, el acto debe ser Domicilio. Se rechaza en vez de adivinar.
 */
export const ACTS_THAT_CONFLICT_WITH_HOME: CopagoAct[] = [
  'laboratorio',
  'examen',
  'medicamentos',
  'procedimiento'
];

export const ACT_LABELS: Record<CopagoAct, string> = {
  consulta: 'Consulta',
  control: 'Control',
  terapia: 'Terapia',
  urgencia: 'Urgencia',
  examen: 'Examen',
  laboratorio: 'Laboratorio',
  medicamentos: 'Medicamentos',
  procedimiento: 'Procedimiento',
  domicilio: 'Domicilio'
};

export const ACT_LABELS_PLURAL: Record<CopagoAct, string> = {
  consulta: 'consultas',
  control: 'controles',
  terapia: 'terapias',
  urgencia: 'urgencias',
  examen: 'exámenes',
  laboratorio: 'laboratorios',
  medicamentos: 'medicamentos',
  procedimiento: 'procedimientos',
  domicilio: 'domicilios'
};

// ─────────────────────────────────────────────
// INSTITUCIONES
// ─────────────────────────────────────────────

export interface InstitutionEntry {
  /** frase normalizada que aparece en el comentario */
  phrase: string;
  /** cómo se muestra */
  label: string;
}

/** El parser las ordena por cantidad de palabras: "nueva eps" gana sobre "eps" */
export const INSTITUTIONS: InstitutionEntry[] = [
  { phrase: 'colmedica', label: 'Colmedica' },
  { phrase: 'salud total', label: 'Salud Total' },
  { phrase: 'sura', label: 'Sura' },
  { phrase: 'nueva eps', label: 'Nueva EPS' },
  { phrase: 'compensar', label: 'Compensar' },
  { phrase: 'sanitas', label: 'Sanitas' },
  { phrase: 'famisanar', label: 'Famisanar' },
  { phrase: 'coomeva', label: 'Coomeva' },
  { phrase: 'medimas', label: 'Medimas' },
  { phrase: 'eps', label: 'EPS' }
];

// ─────────────────────────────────────────────
// ESPECIALIDADES
// ─────────────────────────────────────────────

export interface SpecialtyEntry {
  key: string;
  label: string;
  icon: string; // material-community
  /** fragmentos normalizados; basta que el área CONTENGA alguno */
  aliases: string[];
}

/** El orden importa: gana la primera que coincida */
export const SPECIALTIES: SpecialtyEntry[] = [
  {
    key: 'medico_casa',
    label: 'Médico en casa',
    icon: 'home-heart',
    aliases: ['medico en casa', 'medico domiciliario']
  },
  { key: 'medicina_dolor', label: 'Medicina del dolor', icon: 'needle', aliases: ['dolor'] },
  {
    key: 'medicina_general',
    label: 'Medicina general',
    icon: 'doctor',
    aliases: ['medicina general', 'medicina gral', 'medico general', 'general', 'gral']
  },
  { key: 'neurocirugia', label: 'Neurocirugía', icon: 'medical-bag', aliases: ['neurocirug'] },
  { key: 'neurologia', label: 'Neurología', icon: 'head-cog', aliases: ['neurolog'] },
  { key: 'psiquiatria', label: 'Psiquiatría', icon: 'brain', aliases: ['psiquiat'] },
  { key: 'psicologia', label: 'Psicología', icon: 'head-heart', aliases: ['psicolog', 'sicolog'] },
  { key: 'fisiatria', label: 'Fisiatría', icon: 'human-handsup', aliases: ['fisiatr'] },
  { key: 'reumatologia', label: 'Reumatología', icon: 'bone', aliases: ['reumat'] },
  { key: 'dermatologia', label: 'Dermatología', icon: 'stethoscope', aliases: ['dermat'] },
  { key: 'otorrino', label: 'Otorrinolaringología', icon: 'ear-hearing', aliases: ['otorrino'] },
  {
    key: 'ortopedia',
    label: 'Ortopedia y traumatología',
    icon: 'bone',
    aliases: ['ortoped', 'traumatolog', 'traumatilog']
  },
  {
    key: 'terapia_fisica',
    label: 'Terapia física',
    icon: 'run',
    aliases: ['fisica', 'fisioterapia']
  },
  {
    key: 'terapia_ocupacional',
    label: 'Terapia ocupacional',
    icon: 'hand-heart',
    aliases: ['ocupacional']
  },
  {
    key: 'hidroterapia',
    label: 'Hidroterapia',
    icon: 'pool',
    aliases: ['hidroterapia', 'hidrica', 'hidrico']
  }
];

export const matchSpecialty = (area: string): SpecialtyEntry | undefined => {
  const n = normalizeText(area);
  return SPECIALTIES.find((s) => s.aliases.some((alias) => n.includes(alias)));
};

// ─────────────────────────────────────────────
// GRUPOS DE ACTOS SIN ESPECIALIDAD
// ─────────────────────────────────────────────

export interface GroupMeta {
  key: string;
  label: string;
  icon: string;
}

export const ACT_GROUPS: Partial<Record<CopagoAct, GroupMeta>> = {
  urgencia: { key: 'urgencias', label: 'Urgencias', icon: 'ambulance' },
  examen: { key: 'examenes', label: 'Exámenes', icon: 'radiology-box' },
  laboratorio: { key: 'laboratorio', label: 'Laboratorio', icon: 'test-tube' },
  medicamentos: { key: 'medicamentos', label: 'Medicamentos', icon: 'pill' },
  procedimiento: { key: 'procedimientos', label: 'Procedimientos', icon: 'medical-bag' },
  domicilio: { key: 'domicilio', label: 'Domicilio', icon: 'home-heart' }
};

export const DEFAULT_GROUP_ICON = 'hospital-box';

/** Icono de un grupo del resumen (especialidad o grupo de acto) */
export const getCopagoGroupIcon = (groupKey: string): string => {
  const specialty = SPECIALTIES.find((s) => s.key === groupKey);
  if (specialty) return specialty.icon;
  const group = Object.values(ACT_GROUPS).find((g) => g?.key === groupKey);
  return group?.icon ?? DEFAULT_GROUP_ICON;
};

// ─────────────────────────────────────────────
// TEXTOS DE AYUDA (pantalla, modal, chips)
// ─────────────────────────────────────────────

export const COPAGO_FORMAT_EXAMPLE = 'Colmedica Control Reumatología #2';

export const COPAGO_FORMAT_HINT =
  'Formato: [Institución] Acto Área [#N] [@Paciente] [- nota]\n' +
  'Actos: Consulta, Control, Terapia, Urgencia, Examen, Laboratorio, Medicamentos, Procedimiento, Domicilio\n' +
  'Ej: Colmedica Control Reumatología #2 · Colmedica Terapia Física #5/20 · Salud Total Medicamentos @Julio';

/** Versión corta para el modal */
export const COPAGO_FORMAT_HINT_SHORT = `Ej: ${COPAGO_FORMAT_EXAMPLE} (sin @ se asume ${DEFAULT_PATIENT})`;
