import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  SubcategoryTemplateConfig,
  TemplateChip,
  CommentaryValidationResult
} from '~/shared/types/screens/settings/commentary-templates.types';

// dayjs ya está configurado con locale 'es' en Helpers.ts — lo reusamos aquí
// sin volver a llamar dayjs.locale() para no tener efectos secundarios duplicados

// ============================================================
// HELPERS DE FECHA
// ============================================================

/**
 * Normaliza abreviaciones de mes al estándar del parser.
 * Corrige typos reales encontrados en BD: "Enr" → "Ene", etc.
 * dayjs en español puede devolver variantes según la versión.
 */
export const normalizeMonthAbbr = (raw: string): string => {
  const map: Record<string, string> = {
    enr: 'Ene',
    ene: 'Ene',
    jan: 'Ene',
    feb: 'Feb',
    mar: 'Mar',
    abr: 'Abr',
    apr: 'Abr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    ago: 'Ago',
    aug: 'Ago',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dic: 'Dic',
    dec: 'Dic'
  };
  return map[raw.toLowerCase().trim()] ?? raw;
};

/**
 * Formatea una fecha como "18 Dic" usando dayjs (locale es, igual que Helpers.ts).
 */
export const formatDateShort = (date: Date): string => {
  const d = dayjs(date);
  const month = normalizeMonthAbbr(d.format('MMM'));
  return `${d.date()} ${month}`;
};

/**
 * Formatea una fecha como "18 Dic 2026" usando dayjs.
 */
export const formatDateWithYear = (date: Date): string => {
  const d = dayjs(date);
  const month = normalizeMonthAbbr(d.format('MMM'));
  return `${d.date()} ${month} ${d.year()}`;
};

/**
 * Genera el periodo de ~30 días anterior a hoy para servicios públicos.
 * El año solo aparece en la fecha final (estándar del parser).
 */
const getUtilityPeriod = (today: Date): { start: string; end: string } => {
  const end = dayjs(today);
  const start = end.subtract(30, 'day');

  const startStr = formatDateShort(start.toDate());
  const endMonth = normalizeMonthAbbr(end.format('MMM'));
  const endStr = `${end.date()} ${endMonth} ${end.year()}`;

  return { start: startStr, end: endStr };
};

// ============================================================
// PUNTO DE ENTRADA PRINCIPAL
// ============================================================

/**
 * Retorna la configuración de plantilla para una subcategoría.
 * Detección por nombre (case-insensitive) — sin IDs hardcodeados,
 * funciona para cualquier usuario que use nombres similares.
 */
export const getDefaultTemplateConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => {
  const name = subcategoryName.toLowerCase().trim();
  const cat = categoryName.toLowerCase().trim();

  if (isUtilityLight(name))
    return buildUtilityConfig(subcategoryId, subcategoryName, categoryName, 'Kw', 79);
  if (isUtilityWater(name))
    return buildUtilityConfig(subcategoryId, subcategoryName, categoryName, 'M3', 13);
  if (isUtilityGas(name))
    return buildUtilityConfig(subcategoryId, subcategoryName, categoryName, 'M3', 13);
  if (isProteins(name, cat))
    return buildProductConfig(subcategoryId, subcategoryName, categoryName, 'proteins');
  if (isGroceries(name, cat))
    return buildProductConfig(subcategoryId, subcategoryName, categoryName, 'groceries');
  if (isLiquor(name))
    return buildProductConfig(subcategoryId, subcategoryName, categoryName, 'liquor');
  if (isRetention(name, cat))
    return buildRetentionConfig(subcategoryId, subcategoryName, categoryName);
  if (isCopago(name)) return buildCopagoConfig(subcategoryId, subcategoryName, categoryName);
  if (isMortgage(name)) return buildMortgageConfig(subcategoryId, subcategoryName, categoryName);
  if (isPsychology(name))
    return buildPsychologyConfig(subcategoryId, subcategoryName, categoryName);
  if (isCellPlan(name)) return buildCellPlanConfig(subcategoryId, subcategoryName, categoryName);

  if (isTransport(name, cat))
    return buildTransportConfig(subcategoryId, subcategoryName, categoryName);
  if (isFamilyAid(name, cat))
    return buildFamilyAidConfig(subcategoryId, subcategoryName, categoryName);
  if (isNutrition(name, cat))
    return buildNutritionConfig(subcategoryId, subcategoryName, categoryName);
  if (isSports(name, cat)) return buildSportsConfig(subcategoryId, subcategoryName, categoryName);
  if (isRent(name, cat)) return buildRentConfig(subcategoryId, subcategoryName, categoryName);
  if (isVacation(name, cat))
    return buildVacationConfig(subcategoryId, subcategoryName, categoryName);

  return buildFreeConfig(subcategoryId, subcategoryName, categoryName);
};

// ============================================================
// DETECTORES DE TIPO (genéricos, sin IDs hardcodeados)
// ============================================================

const isUtilityLight = (n: string) =>
  n.includes('luz') || n.includes('electricidad') || n.includes('energia');

const isUtilityWater = (n: string) => n.includes('agua') && !n.includes('aguardiente');

const isUtilityGas = (n: string) => n === 'gas' || n.startsWith('gas(') || n.startsWith('gas ');

const isProteins = (n: string, cat: string) =>
  n.includes('proteina') || // "proteinas" sin tilde
  n.includes('proteína') || // "proteínas" con tilde ← fix
  n.includes('carne') ||
  n.includes('pollo') ||
  n.includes('pescado') ||
  (cat.includes('alimentac') && (n.includes('proteina') || n.includes('proteína')));

const isGroceries = (n: string, cat: string) =>
  n.includes('mercado') ||
  n.includes('verdura') ||
  n.includes('fruta') ||
  (cat.includes('alimentac') && n.includes('mercado'));

const isLiquor = (n: string) => n.includes('licor') || n.includes('cerveza') || n.includes('vino');

const isRetention = (n: string, cat: string) =>
  n.includes('nómina') ||
  n.includes('nomina') ||
  n.includes('retenci') ||
  n.includes('salario') ||
  n.includes('seguridad social') ||
  (cat.includes('ingreso') && n.includes('salario'));

const isMortgage = (n: string) =>
  n.includes('apto') ||
  n.includes('apartamento') ||
  n.includes('préstamo') ||
  n.includes('prestamo') ||
  // "cuota" solo si NO es moderadora/médica
  (n.includes('cuota') && !n.includes('moderadora') && !n.includes('copago'));

const isPsychology = (n: string) =>
  n.includes('psicolog') || n.includes('terapia') || n.includes('consulta');

const isCopago = (n: string) =>
  n.includes('copago') || n.includes('moderadora') || n.includes('cuota moderadora');

const isCellPlan = (n: string) =>
  n.includes('celular') || n.includes('plan ') || n.includes('teléfono') || n.includes('telefono');

const isTransport = (n: string, cat: string) =>
  n.includes('transporte') || // ← fix: buscar también en el nombre
  cat.includes('transporte') ||
  n.includes('taxi') ||
  n.includes('uber') ||
  n.includes('bus') ||
  n.includes('metrolinea') ||
  n.includes('megabus') ||
  n.includes('indriver') ||
  n.includes('didi') ||
  n.includes('beat');

const isFamilyAid = (n: string, cat: string) =>
  n.includes('ayuda') || n.includes('regalo') || (cat.includes('regalo') && n.includes('familiar'));

const isNutrition = (n: string, cat: string) =>
  n.includes('nutrici') || n.includes('nutric') || (cat.includes('salud') && n.includes('nutrici'));

const isSports = (n: string, cat: string) =>
  n.includes('deporte') ||
  n.includes('futsal') ||
  n.includes('fútbol') ||
  n.includes('futbol') ||
  n.includes('gym') ||
  n.includes('gimnasio') ||
  (cat.includes('cultura') && n.includes('deporte'));

const isVacation = (n: string, cat: string) =>
  n.includes('vacacion') ||
  n.includes('vacación') ||
  n.includes('viaje') ||
  cat.includes('vacacion') ||
  (cat.includes('cultura') && n.includes('vacacion'));

const isRent = (n: string, cat: string) =>
  n.includes('arriendo') || // ← fix: nombre solo es suficiente
  n.includes('arrendamiento') ||
  ((n.includes('arriendo') || n.includes('arrendamiento')) && cat.includes('vivienda'));

// ============================================================
// BUILDERS
// ============================================================

const buildUtilityConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string,
  unit: 'Kw' | 'M3',
  defaultConsumption: number
): SubcategoryTemplateConfig => {
  const { start, end } = getUtilityPeriod(new Date());

  const chips: TemplateChip[] = [
    {
      label: 'Solo',
      icon: 'account',
      template: `Consumo(${defaultConsumption} ${unit}) ${start} - ${end} [Solos]`,
      hint: 'Periodo solo, sin personas adicionales'
    },
    {
      label: 'Con Margot',
      icon: 'account-multiple',
      template: `Consumo(${defaultConsumption} ${unit}) ${start} - ${end} [Con Margot]`,
      hint: 'Margot estuvo todo el periodo'
    },
    {
      label: 'Deshabitado',
      icon: 'home-off',
      template: `Consumo(${defaultConsumption} ${unit}) ${start} - ${end} [Solos] [Deshabitado 4 días]`,
      hint: 'Hubo días sin habitar (viaje, etc.)'
    },
    {
      label: 'Con visitas',
      icon: 'account-group',
      template: `Consumo(${defaultConsumption} ${unit}) ${start} - ${end} [Solos] [Visitas: 2]`,
      hint: 'Hubo visitas durante el periodo'
    }
  ];

  return {
    subcategoryId,
    subcategoryName,
    categoryName,
    assistanceLevel: 'structured',
    parserType: 'utility',
    chips,
    smartPlaceholder: `Consumo(${defaultConsumption} ${unit}) ${start} - ${end} [Solos]`,
    enableValidation: true
  };
};

const buildProductConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string,
  variant: 'proteins' | 'groceries' | 'liquor'
): SubcategoryTemplateConfig => {
  const chipsMap: Record<string, TemplateChip[]> = {
    proteins: [
      {
        label: 'Con precio',
        icon: 'tag',
        template: 'Producto — 0,500 kg @ $20.000/kg [Carulla]',
        hint: 'Formato completo: nombre, cantidad, precio/kg y tienda'
      },
      {
        label: 'Con descuento',
        icon: 'sale',
        template: 'Producto — 0,500 kg @ $14.000/kg (antes $20.000/kg, -30%) [Carulla]',
        hint: 'Incluye precio original y % de descuento'
      },
      {
        label: 'Solo tienda',
        icon: 'store',
        template: 'Producto [Carulla]',
        hint: 'Formato simplificado sin precio'
      }
    ],
    groceries: [
      {
        label: 'Con precio/kg',
        icon: 'tag',
        template: 'Producto — 1,000 kg @ $3.000/kg [Carulla]',
        hint: 'Peso en kg con precio unitario'
      },
      {
        label: 'Por unidad',
        icon: 'numeric-1-box',
        template: 'Producto — 1 un @ $5.000 [Carulla]',
        hint: 'Para productos que se venden por unidad'
      },
      {
        label: 'Solo tienda',
        icon: 'store',
        template: 'Producto [D1]',
        hint: 'Formato simplificado'
      }
    ],
    liquor: [
      {
        label: 'Por unidad',
        icon: 'bottle-wine',
        template: 'Producto — 1 un @ $12.500 [Carulla]',
        hint: 'Botella o unidad con precio total'
      },
      {
        label: 'Solo tienda',
        icon: 'store',
        template: 'Producto [Carulla]',
        hint: 'Formato simplificado'
      }
    ]
  };

  return {
    subcategoryId,
    subcategoryName,
    categoryName,
    assistanceLevel: 'structured',
    parserType: 'product',
    chips: chipsMap[variant],
    smartPlaceholder: 'Ej: Pechuga — 0,500 kg @ $14.000/kg [Carulla]',
    enableValidation: true
  };
};

const buildRetentionConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'structured',
  parserType: 'retention',
  chips: [
    {
      label: 'Normal',
      icon: 'bank-minus',
      template: 'Retefu: 517.000',
      hint: 'Nómina sin incapacidad ni primas'
    },
    {
      label: '+ Incapacidad',
      icon: 'medical-bag',
      template: 'Retefu: 517.000\nIncapacidad: Prim: 2 días',
      hint: 'Con días de incapacidad primeros (sin descuento económico)'
    },
    {
      label: '+ EPS',
      icon: 'hospital-box',
      template: 'Retefu: 517.000\nIncapacidad: Prim: 2 días, Eps: 13 días',
      hint: 'Con días EPS (afectan el salario recibido)'
    },
    {
      label: '+ Prima',
      icon: 'cash-plus',
      template: 'Retefu: 517.000\nPrima nav: 609.000',
      hint: 'Nómina con prima — agregar línea por cada prima'
    }
  ],
  smartPlaceholder: 'Ej: Retefu: 517.000\nIncapacidad: Prim: 2 días, Eps: 13 días',
  enableValidation: true
});

const buildMortgageConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'semi',
  parserType: 'custom',
  chips: [
    {
      label: 'Cuota',
      icon: 'home-city',
      template: 'Cuota # 1/23',
      hint: 'Número de cuota sobre total'
    }
  ],
  smartPlaceholder: 'Ej: Cuota # 18/23',
  enableValidation: false
});

const buildPsychologyConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => {
  const today = dayjs();
  const month = normalizeMonthAbbr(today.format('MMM'));
  const dateStr = `${today.date()} ${month} ${today.year()}`;

  return {
    subcategoryId,
    subcategoryName,
    categoryName,
    assistanceLevel: 'semi',
    parserType: 'custom',
    chips: [
      {
        label: 'Consulta',
        icon: 'head-heart',
        template: `1 consulta(individual ${dateStr})`,
        hint: 'Número de consulta + tipo + fecha'
      }
    ],
    smartPlaceholder: 'Ej: 46 consulta(individual 02 Mar 2026)',
    enableValidation: false
  };
};

const buildCopagoConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'structured',
  parserType: 'copago',
  chips: [
    {
      label: 'Terapia',
      icon: 'hospital-box',
      template: 'Copago Colmedica Terapia Física #1/20',
      hint: 'Terapia con número de sesión sobre total'
    },
    {
      label: 'Consulta',
      icon: 'doctor',
      template: 'Copago Colmedica consulta Neurología',
      hint: 'Consulta o cita médica sin conteo de sesiones'
    },
    {
      label: 'Control',
      icon: 'clipboard-check',
      template: 'Copago Colmedica control Psiquiatría',
      hint: 'Control de seguimiento'
    },
    {
      label: 'Fisiatría',
      icon: 'run',
      template: 'Copago fisiatría #1/10',
      hint: 'Copago Fisiatría sin institución'
    }
  ],
  smartPlaceholder: 'Ej: Copago Colmedica Terapia Física #11/20',
  enableValidation: true
});

const buildCellPlanConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'semi',
  parserType: 'custom',
  chips: [
    {
      label: 'Plan',
      icon: 'cellphone',
      template: 'Plan Julio',
      hint: 'Plan celular + nombre de la persona'
    }
  ],
  smartPlaceholder: 'Ej: Plan Julio',
  enableValidation: false
});

const buildTransportConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'semi',
  parserType: 'custom',
  chips: [
    {
      label: 'Origen → Destino',
      icon: 'map-marker-right',
      template: 'Origen a Destino',
      hint: 'Trayecto simple'
    },
    {
      label: 'Ida y vuelta',
      icon: 'repeat',
      template: 'Ida y vuelta Origen a Destino',
      hint: 'Trayecto de ida y regreso'
    },
    {
      label: '2 pasajes',
      icon: 'account-multiple',
      template: '2 pasajes Origen a Destino',
      hint: 'Múltiples pasajeros'
    }
  ],
  smartPlaceholder: 'Ej: Villa Verde a Centro',
  enableValidation: false
});

const buildFamilyAidConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => {
  const today = dayjs();
  const currentMonth = normalizeMonthAbbr(today.format('MMM'));
  const nextMonth = normalizeMonthAbbr(today.add(1, 'month').format('MMM'));
  const year = today.year();

  return {
    subcategoryId,
    subcategoryName,
    categoryName,
    assistanceLevel: 'semi',
    parserType: 'custom',
    chips: [
      {
        label: 'Bimensual',
        icon: 'account-heart',
        template: `Ayuda bimensual a Persona ${currentMonth}-${nextMonth} ${year} #1`,
        hint: 'Ayuda que cubre dos meses'
      },
      {
        label: 'Mensual',
        icon: 'calendar-month',
        template: `Ayuda mensual a Persona ${currentMonth} ${year} #1`,
        hint: 'Ayuda mensual'
      },
      {
        label: 'Saldo',
        icon: 'cash-check',
        template: `Saldo de Ayuda bimensual a Persona ${currentMonth}-${nextMonth} ${year} #1`,
        hint: 'Pago del saldo pendiente'
      }
    ],
    smartPlaceholder: `Ej: Ayuda bimensual a Papá Jairo ${currentMonth}-${nextMonth} ${year} #9`,
    enableValidation: false
  };
};

const buildNutritionConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'semi',
  parserType: 'custom',
  chips: [
    {
      label: 'Semana',
      icon: 'food-apple',
      template: 'Semana 1 Natural Body Center',
      hint: 'Número de semana + nombre del centro'
    }
  ],
  smartPlaceholder: 'Ej: Semana 6 Natural Body Center',
  enableValidation: false
});

const buildSportsConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => {
  const today = dayjs();
  const currentMonth = normalizeMonthAbbr(today.format('MMM'));

  return {
    subcategoryId,
    subcategoryName,
    categoryName,
    assistanceLevel: 'semi',
    parserType: 'custom',
    chips: [
      {
        label: 'Mensualidad',
        icon: 'calendar-check',
        template: `Mensualidad ${currentMonth} (futsal)`,
        hint: 'Cuota mensual al club o academia'
      },
      {
        label: 'Cancha',
        icon: 'soccer-field',
        template: 'Cancha Lugar deporte',
        hint: 'Alquiler de cancha'
      },
      {
        label: 'Arbitraje',
        icon: 'whistle',
        template: 'Arbitraje Futsal Amistoso',
        hint: 'Pago de árbitro'
      }
    ],
    smartPlaceholder: `Ej: Mensualidad ${currentMonth} (futsal)`,
    enableValidation: false
  };
};

const buildRentConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => {
  const today = dayjs();
  const currentMonth = normalizeMonthAbbr(today.format('MMM'));
  const year = today.year();
  const daysInMonth = today.daysInMonth();

  return {
    subcategoryId,
    subcategoryName,
    categoryName,
    assistanceLevel: 'semi',
    parserType: 'custom',
    chips: [
      {
        label: 'Mes completo',
        icon: 'home',
        template: `Arriendo ${currentMonth} ${year}`,
        hint: 'Pago del mes completo'
      },
      {
        label: 'Días parciales',
        icon: 'calendar-range',
        template: `${daysInMonth} días mes ${currentMonth} ${year}`,
        hint: 'Pago proporcional por días'
      },
      {
        label: 'Nuevo valor',
        icon: 'pencil',
        template: 'Nuevo valor apt descripción',
        hint: 'Registro de cambio de canon'
      }
    ],
    smartPlaceholder: `Ej: 22 días mes ${currentMonth} ${year}`,
    enableValidation: false
  };
};

const buildVacationConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => {
  const today = dayjs();
  const month = normalizeMonthAbbr(today.format('MMM'));

  return {
    subcategoryId,
    subcategoryName,
    categoryName,
    assistanceLevel: 'semi',
    parserType: 'vacation',
    chips: [
      {
        label: 'Alojamiento',
        icon: 'bed',
        template: `Alojamiento Hotel Nombre ${today.daysInMonth()} noches [Solo alojamiento] [Destino]`,
        hint: 'Hotel, Airbnb, Hostal, etc. — reemplaza Tipo, Nombre y Destino'
      },
      {
        label: 'Con impuestos',
        icon: 'receipt',
        template: `Alojamiento Hotel Nombre 1 noche [Solo alojamiento] [Destino]\nTarifa: 428.618\nImpuestos: 87.037`,
        hint: 'Alojamiento con desglose de tarifa base e impuestos'
      },
      {
        label: 'Tiquete',
        icon: 'airplane',
        template: `Tiquete Avianca Pereira-Destino 2 pasajeros [01 ${month}-05 ${month}]`,
        hint: 'Vuelo con aerolínea, ruta y número de pasajeros'
      },
      {
        label: 'Gasto',
        icon: 'map-marker',
        template: 'Destino: descripción del gasto',
        hint: 'Gasto suelto — empieza con el destino seguido de dos puntos'
      }
    ],
    smartPlaceholder: 'Ej: Cartagena: almuerzo en La Mulata',
    enableValidation: false
  };
};
const buildFreeConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'free',
  parserType: 'none',
  chips: [],
  enableValidation: false
});

// ============================================================
// VALIDACIÓN DE COMENTARIO
// Regex liviano — no importa los parsers completos para evitar
// dependencia circular con el sistema de análisis.
// ============================================================

export const validateCommentary = (
  commentary: string,
  config: SubcategoryTemplateConfig
): CommentaryValidationResult => {
  if (!config.enableValidation) return { state: 'neutral' };
  if (!commentary?.trim()) return { state: 'empty' };

  switch (config.parserType) {
    case 'utility':
      return validateUtility(commentary.trim());
    case 'product':
      return validateProduct(commentary.trim());
    case 'retention':
      return validateRetention(commentary.trim());
    default:
      return { state: 'neutral' };
  }
};

const validateUtility = (text: string): CommentaryValidationResult => {
  const hasConsumption = /Consumo\s*\(\s*\d+\s*(Kw|M3)\s*\)/i.test(text);
  const hasPeriod = /\d+\s+\w+\s*[-–]\s*\d+\s+\w+/i.test(text);
  const hasContext = /\[.+\]/i.test(text);

  if (hasConsumption && hasPeriod && hasContext) return { state: 'valid' };
  if (hasConsumption && hasPeriod)
    return { state: 'warning', message: 'Falta situación [Solos] o [Con ...]' };
  if (hasConsumption) return { state: 'warning', message: 'Falta el periodo de fechas' };
  return { state: 'warning', message: 'Formato: Consumo(X Kw) fecha - fecha [situación]' };
};

const validateProduct = (text: string): CommentaryValidationResult => {
  const hasPrice = /@\s*\$[\d.,]+/.test(text);
  const hasStore = /\[.+\]/.test(text);
  const hasDash = /—|--/.test(text);
  const hasQuantity = /[\d,.]+ (kg|un)/i.test(text);

  if (hasPrice && hasStore && hasDash && hasQuantity) return { state: 'valid' };
  if (hasPrice && hasStore) return { state: 'warning', message: 'Falta cantidad (kg o un)' };
  if (hasDash && hasQuantity)
    return { state: 'warning', message: 'Falta precio (@) y/o tienda [...]' };
  if (text.length > 2)
    return { state: 'warning', message: 'Formato: Producto — qty @ $precio [Tienda]' };
  return { state: 'empty' };
};

const validateRetention = (text: string): CommentaryValidationResult => {
  const hasKeyword = /retefu|retenci[oó]n/i.test(text);
  const hasAmount = /[\d.]+/.test(text);

  if (hasKeyword && hasAmount) return { state: 'valid' };
  if (hasKeyword) return { state: 'warning', message: 'Falta el monto de retención' };
  return { state: 'neutral' };
};
