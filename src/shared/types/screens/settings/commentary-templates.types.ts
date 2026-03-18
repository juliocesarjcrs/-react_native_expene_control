// ============================================================
// TIPOS: Sistema de Plantillas de Comentarios
// ============================================================

/**
 * Nivel de asistencia que ofrece el sistema para una subcategoría.
 * - structured: tiene parser (Luz, Agua, Gas, Proteínas, Mercado)
 * - semi:       patrón repetitivo sin parser (Psicología, Cuota Apto)
 * - free:       comentario libre, solo historial como ayuda
 */
export type TemplateAssistanceLevel = 'structured' | 'semi' | 'free';

/**
 * Tipo de template según el parser que lo consume.
 */
export type TemplateParserType = 'utility' | 'product' | 'retention' | 'copago' | 'custom' | 'none';

/**
 * Un chip de acceso rápido que aparece encima del textarea.
 * Al pulsarlo inserta texto pre-llenado editable directamente.
 */
export interface TemplateChip {
  /** Etiqueta corta visible en el chip */
  label: string;
  /** Icono material-community */
  icon: string;
  /** Texto pre-llenado que se inserta en el textarea */
  template: string;
  /** Descripción de ayuda (aparece como hint bajo el textarea) */
  hint?: string;
}

/**
 * Configuración completa de plantilla para una subcategoría.
 * Se almacena en AsyncStorage con clave `template_{subcategoryId}`.
 */
export interface SubcategoryTemplateConfig {
  subcategoryId: number;
  subcategoryName: string;
  categoryName: string;
  assistanceLevel: TemplateAssistanceLevel;
  parserType: TemplateParserType;
  /** Chips de acceso rápido (0–4 chips) */
  chips: TemplateChip[];
  /** Placeholder del textarea cuando hay plantillas */
  smartPlaceholder?: string;
  /** Si true, el borde cambia de color según validación del parser */
  enableValidation: boolean;
  /** Si es personalizada por el usuario (editada manualmente) */
  isCustomized?: boolean;
  /** Fecha de última modificación */
  updatedAt?: string;
}

/**
 * Estado de validación del comentario actual.
 */
export type CommentaryValidationState = 'valid' | 'warning' | 'empty' | 'neutral';

/**
 * Resultado de validar un comentario contra un parser.
 */
export interface CommentaryValidationResult {
  state: CommentaryValidationState;
  message?: string;
}

/**
 * Props que CreateExpenseScreen pasa a CommentaryInput.
 */
export interface CommentaryInputContextProps {
  /** ID de la subcategoría seleccionada */
  subcategoryId: number | null;
  /** Nombre de la subcategoría (para buscar config) */
  subcategoryName?: string;
  /** Nombre de la categoría padre */
  categoryName?: string;
  /** Gastos recientes ya cargados desde el backend */
  recentExpenses?: RecentExpenseForSuggestion[];
}

/**
 * Versión reducida de ExpenseModel para sugerencias de historial.
 * Solo necesitamos el comentario y la fecha.
 */
export interface RecentExpenseForSuggestion {
  id: number;
  commentary: string;
  date: string;
  cost: number;
}

/**
 * Item de historial mostrado en el dropdown de sugerencias.
 */
export interface HistorySuggestion {
  commentary: string;
  date: string;
  cost: number;
  /** Origen: 'live' = vino del backend, 'cached' = AsyncStorage */
  source: 'live' | 'cached';
}

/**
 * Estructura guardada en AsyncStorage por subcategoría.
 * Clave: `commentary_history_{subcategoryId}`
 */
export interface CachedCommentaryHistory {
  subcategoryId: number;
  entries: HistorySuggestion[];
  /** Fecha del último guardado */
  savedAt: string;
}
