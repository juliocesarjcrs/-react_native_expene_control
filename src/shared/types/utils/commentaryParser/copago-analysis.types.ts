/**
 * Tipos para el parser de copagos médicos
 * Ubicación: src/shared/types/utils/commentaryParser/copago-analysis.types.ts
 *
 * Formato estándar:
 *   [Copago] [Institución] {Acto} {Área} [#N[/Total]] [@Paciente] [- nota libre]
 *
 * Ejemplos:
 *   "Colmedica Consulta Reumatología #1"
 *   "Colmedica Control Reumatología #2 - resultado resonancia"
 *   "Colmedica Terapia Física #11/20"
 *   "Salud Total Medicamentos @Julio"
 *   "Domicilio Laboratorio - Lopez Correa"
 *
 * Dos ejes independientes:
 *   - ACTO: qué ocurrió (consulta, control, terapia, examen…)
 *   - ÁREA: sobre qué (especialidad, examen concreto…)
 */

export type CopagoAct =
  | 'consulta' // primera vez / cita de especialidad
  | 'control' // seguimiento de una especialidad
  | 'terapia' // sesiones: física, ocupacional, hidroterapia, psicología
  | 'urgencia'
  | 'examen' // imágenes y otros exámenes (gammagrafía, ecografía…)
  | 'laboratorio' // laboratorio en sede física
  | 'medicamentos'
  | 'procedimiento'
  | 'domicilio'; // atención o toma de muestra a domicilio

/**
 * session → número de sesión de una terapia (ciclo con total, ej. #5/20)
 * visit   → número de cita de una especialidad (la primera vez es #1)
 */
export type CopagoSequenceKind = 'session' | 'visit';

export interface CopagoData {
  cost: number;
  date: string;

  institution?: string; // "Colmedica", "Salud Total" — undefined si no se menciona

  /** Paciente. Si el comentario no lo dice, se asigna DEFAULT_PATIENT */
  patient: string;
  /** true si el comentario lo escribió (@Julio o nombre suelto) */
  patientIsExplicit: boolean;

  act: CopagoAct;
  /** Texto del área tal como se escribió: "Neurología", "Gammagrafía ósea" */
  area?: string;

  /** Especialidad canónica (solo en consulta/control/terapia/urgencia con área) */
  specialtyKey?: string;
  specialtyLabel?: string;
  /** false si la especialidad no está en el catálogo (se agrupa por su propio texto) */
  isKnownSpecialty?: boolean;

  /** Clave y etiqueta con las que se agrupa en el resumen (nunca hay grupo "Otro") */
  groupKey: string;
  groupLabel: string;

  /** #N — número de sesión (terapia) o de cita (resto) */
  sequenceNumber?: number;
  /** /Total — solo para ciclos cerrados (terapias) */
  totalSessions?: number;
  hasSequence: boolean;
  sequenceKind?: CopagoSequenceKind;

  /** Texto libre tras " - " (ciudad, clínica, motivo…) */
  note?: string;
}

/**
 * Estadísticas de una serie numerada (paciente + especialidad) en un ciclo.
 * Un ciclo nuevo empieza cuando aparece #1, cambia el total o el número retrocede.
 */
export interface CopagoSeriesStats {
  patient: string;
  specialtyKey: string;
  specialtyLabel: string;
  institution?: string;
  sequenceKind: CopagoSequenceKind;

  /** Número de ciclo dentro de paciente+especialidad (1 = el más antiguo) */
  episode: number;
  totalEpisodes: number;

  /** Cantidad de gastos registrados en el ciclo */
  entries: number;
  /** Mayor #N alcanzado (no depende de que estén todos registrados) */
  lastNumber: number;
  totalSessions?: number; // del último registro que lo traiga
  progressPercent?: number; // lastNumber / totalSessions, máx 100
  isClosed: boolean;
  /** Números que faltan entre el menor y el mayor registrado */
  missingNumbers: number[];

  /** Conteo por acto dentro del ciclo: { consulta: 1, control: 2 } */
  acts: Partial<Record<CopagoAct, number>>;

  totalCost: number;
  avgCost: number;
  /** Copago del último registro del ciclo (el precio más reciente) */
  lastCost: number;
  firstDate: string;
  lastDate: string;
}

/** Gasto de un mes, desglosado por paciente */
export interface CopagoMonthlySpending {
  /** 'YYYY-MM' */
  month: string;
  /** 'Oct 2026' */
  label: string;
  total: number;
  count: number;
  byPatient: Record<string, number>;
}

/** Ciclo de terapia abierto con total conocido: cuánto falta por pagar */
export interface CopagoPendingCycle {
  patient: string;
  specialtyKey: string;
  specialtyLabel: string;
  institution?: string;
  lastNumber: number;
  totalSessions: number;
  remainingSessions: number;
  /** Último copago pagado del ciclo — base de la estimación */
  lastCost: number;
  /** remainingSessions × lastCost */
  estimatedCost: number;
}

export interface CopagoPendingSummary {
  cycles: CopagoPendingCycle[];
  totalRemainingSessions: number;
  totalEstimatedCost: number;
  /** Terapias abiertas sin /Total (ej. psicología): no se pueden proyectar */
  openWithoutTotal: number;
}
