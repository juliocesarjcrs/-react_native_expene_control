/**
 * Fuente de verdad central para el sistema de análisis de comentarios
 * Ubicación: src/shared/types/utils/commentaryParser/commentary-registry.ts
 *
 * Conecta: ParserType → chips de autocompletado → pantalla → ruta de navegación
 *
 * Cada vez que se añade un parser nuevo, este es el ÚNICO archivo que requiere
 * actualización (además de StatisticsStackParamList si la ruta es nueva).
 */

import { ParserType } from '~/utils/commentaryParser';
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';
import { ThemeColors } from '../../services/theme-config-service.type';
// import { ThemeColors } from '~/shared/types/theme.types'; // ajusta el path si difiere

// ─────────────────────────────────────────────
// TIPO BASE
// ─────────────────────────────────────────────

export interface CommentaryAnalysisEntry {
  /** Clave única que identifica el parser — debe coincidir con ParserType */
  parserType: Exclude<ParserType, 'none'>;

  /** Texto visible en CommentaryAnalysisScreen (título de la opción) */
  displayName: string;

  /** Descripción corta visible bajo el título */
  subtitle: string;

  /** Nombre del icono para react-native-elements / material-community */
  icon: string;

  /** Clave del color del icono en ThemeColors (sin hardcodear hex) */
  iconColorKey: keyof ThemeColors;

  /** Ruta en StatisticsStackParamList a la que navega esta entrada */
  route: keyof StatisticsStackParamList;

  /**
   * Subcategorías que activan este parser.
   * Deben coincidir exactamente con los nombres usados en
   * commentaryTemplates.utils.ts → getDefaultTemplateConfig().
   *
   * Usado por templateChipSync.test.ts para verificar la sincronía.
   */
  subcategoryDetectors: string[];

  /**
   * Comentario de ejemplo que el parser DEBE poder leer sin retornar null.
   * Usado en registry-integrity.test.ts para smoke-test de cada parser.
   */
  exampleCommentary: string;
}

// ─────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────

export const COMMENTARY_REGISTRY: CommentaryAnalysisEntry[] = [
  {
    parserType: 'utility',
    displayName: 'Servicios Públicos',
    subtitle: 'Analiza consumo de luz, agua y gas',
    icon: 'flash',
    iconColorKey: 'WARNING',
    route: 'utilityAnalysis',
    subcategoryDetectors: ['Luz', 'Agua', 'Gas'],
    exampleCommentary: 'Consumo(100 Kw) 18 Dic - 17 Ene 2026 [Solos]'
  },
  {
    parserType: 'product',
    displayName: 'Precios de Productos',
    subtitle: 'Compara precios de mercado y proteínas',
    icon: 'cart',
    iconColorKey: 'SUCCESS',
    route: 'productPrices',
    subcategoryDetectors: ['Proteínas', 'Mercado', 'Licores'],
    exampleCommentary: 'Pechuga — 0,500 kg @ $14.000/kg [Carulla]'
  },
  {
    parserType: 'retention',
    displayName: 'Retenciones de Nómina',
    subtitle: 'Analiza retefuente y descuentos salariales',
    icon: 'cash-minus',
    iconColorKey: 'ERROR',
    route: 'retentionAnalysis',
    subcategoryDetectors: ['Retenciones Julio', 'Retenciones Silvia'],
    exampleCommentary: 'Retefu: 335.000 | Salario ordinario'
  },
  {
    parserType: 'transport',
    displayName: 'Transporte',
    subtitle: 'Rutas frecuentes y costos de viaje',
    icon: 'car',
    iconColorKey: 'INFO',
    route: 'transportAnalysis',
    subcategoryDetectors: [
      'Taxi',
      'Bus',
      'Uber / Beat / InDrive',
      'Transporte del Trabajo',
      'Transporte a clase inglés'
    ],
    exampleCommentary: 'Villa Verde a Centro'
  },
  {
    parserType: 'familyAid',
    displayName: 'Ayuda Familiar',
    subtitle: 'Seguimiento de ayudas y regalos a familia',
    icon: 'account-heart',
    iconColorKey: 'PRIMARY',
    route: 'familyAidAnalysis',
    subcategoryDetectors: ['Regalos', 'Ayuda familiar'],
    exampleCommentary: 'Ayuda bimensual a Papá Jairo Mar-Abr 2026 #9'
  },
  {
    parserType: 'nutrition',
    displayName: 'Nutrición',
    subtitle: 'Progreso y costos de plan nutricional',
    icon: 'food-apple',
    iconColorKey: 'SUCCESS',
    route: 'nutritionAnalysis',
    subcategoryDetectors: ['Nutrición'],
    exampleCommentary: 'Semana 6 Natural Body Center'
  },
  {
    parserType: 'sports',
    displayName: 'Deportes',
    subtitle: 'Mensualidades, canchas y equipamiento',
    icon: 'soccer',
    iconColorKey: 'WARNING',
    route: 'sportsAnalysis',
    subcategoryDetectors: ['Deportes'],
    exampleCommentary: 'Mensualidad Mar (futsal)'
  },
  {
    parserType: 'rent',
    displayName: 'Arriendo',
    subtitle: 'Historial de pagos y cambios de canon',
    icon: 'home-city',
    iconColorKey: 'INFO',
    route: 'rentAnalysis',
    subcategoryDetectors: ['Arriendo'],
    exampleCommentary: '22 días mes Febrero 2026'
  },
  {
    parserType: 'copago',
    displayName: 'Copagos Médicos',
    subtitle: 'Sesiones de terapia, consultas y controles',
    icon: 'hospital-box',
    iconColorKey: 'INFO',
    route: 'copagoAnalysis',
    subcategoryDetectors: ['Cuota moderadora', 'Copago'],
    exampleCommentary: 'Copago Colmedica terapia física #11/20'
  },
  {
    parserType: 'vacation',
    displayName: 'Vacaciones',
    subtitle: 'Alojamiento, tiquetes y gastos por destino',
    icon: 'airplane',
    iconColorKey: 'SUCCESS',
    route: 'vacationAnalysis',
    subcategoryDetectors: ['Vacaciones', 'Viaje'],
    exampleCommentary: 'Alojamiento Hotel Cartagena Plaza 4 noches [Todo incluido] [Cartagena]'
  }
];

// ─────────────────────────────────────────────
// HELPERS DE ACCESO
// ─────────────────────────────────────────────

/** Busca la entry por parserType. Útil en los parsers y tests. */
export const getRegistryEntry = (
  parserType: Exclude<ParserType, 'none'>
): CommentaryAnalysisEntry | undefined =>
  COMMENTARY_REGISTRY.find((e) => e.parserType === parserType);

/** Devuelve todas las rutas registradas. Útil para validar StatisticsStackParamList. */
export const getRegisteredRoutes = (): Array<keyof StatisticsStackParamList> =>
  COMMENTARY_REGISTRY.map((e) => e.route);
