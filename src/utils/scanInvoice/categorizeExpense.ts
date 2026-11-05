import { CategoryDropdown } from '~/shared/types/components/modal/MultiExpenseModal.type';

// ============================================================
// NORMALIZACIÓN
// ============================================================

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * El OCR entrega "Nombre — 1,150 kg @ $20.900/kg [Tienda]".
 * Solo el nombre decide la subcategoría: ni el peso, ni el precio ni la tienda
 * deben producir coincidencias (ej. "[Pollo Ya]" no vuelve proteína a una yuca).
 */
const extractProductName = (description: string): string => {
  const name = description
    .split(' — ')[0]
    .replace(/\s*\[[^\]]*\]\s*$/, '')
    .trim();
  return name || description.trim();
};

// ============================================================
// REGLAS
//
// `subcategory` es un FRAGMENTO del nombre, no el nombre completo.
// Se compara normalizado (sin tildes ni mayúsculas) con "contiene", así
// "Proteínas (carne, pollo, pescado)" coincide con 'proteinas' y renombrar
// una subcategoría no rompe el OCR. Si ninguna subcategoría contiene el
// fragmento, la regla se salta (igual que antes).
//
// Coincidencia de palabras clave:
//   - Normal: la clave debe EMPEZAR donde empieza una palabra
//     ('pollo' coincide con "pollos", no con "repollo").
//   - Claves de hasta 4 letras, o reglas con exactMatch: palabra completa
//     ('ron' no coincide con "macarrón"; 'res' no coincide con "crespa").
// Gana la clave más larga; en empate, la regla que aparece primero.
// ============================================================

type Rule = {
  category: string;
  subcategory: string;
  keywords: string[];
  exactMatch?: boolean;
};

const MAIN_CATEGORIES = ['Alimentación', 'Vivienda', 'Aseo y cuidado personal'];
const FALLBACK_SUBCATEGORY = 'mercado';
const WHOLE_WORD_MAX_LENGTH = 4;
const EXACT_RULE_BONUS = 100;

const RULES: Rule[] = [
  // ALIMENTACIÓN
  {
    category: 'Alimentación',
    subcategory: 'desayunos y cenas',
    keywords: [
      'desayuno',
      'cena',
      'pan',
      'panela',
      'pandebono',
      'huevo',
      'leche',
      'queso',
      'cafe',
      'atun',
      'harina',
      'arepa',
      'empanada',
      'jamon',
      'salchicha',
      'chorizo',
      'tocineta',
      'chocolate en polvo',
      'chocolate de mesa',
      'chocolate corona',
      'chocolate aroma',
      'chocolisto',
      'yogur',
      'kumis',
      'cuajada',
      'mantequilla',
      'esparcible',
      'granola',
      'avena',
      'mermelada',
      'infusion',
      'aromatica'
    ]
  },
  {
    category: 'Alimentación',
    subcategory: 'proteinas',
    keywords: [
      'proteina',
      'carne',
      'pollo',
      'pernil',
      'pierna',
      'espaldilla',
      'morillo',
      'pescado',
      'pechuga',
      'res',
      'tilapia',
      'pecho',
      'lomo',
      'lagarto',
      'trucha',
      'contramuslo',
      'muslo',
      'muchacho',
      'solomo',
      'sobrebarriga',
      'higado',
      'cadera',
      'pepino res'
    ]
  },
  {
    category: 'Alimentación',
    subcategory: 'mercado',
    keywords: [
      'mercado',
      'aguacate',
      'fruta',
      'verdura',
      'arroz',
      'papa',
      'cebolla',
      'tomate',
      'zanahoria',
      'pepino',
      'coliflor',
      'brocoli',
      'spacghetti',
      'fresa'
    ]
  },
  {
    category: 'Alimentación',
    subcategory: 'gaseosas',
    keywords: ['gaseosa', 'refresco', 'pony', 'coca', 'pepsi', 'gas']
  },
  {
    category: 'Alimentación',
    subcategory: 'chucherias',
    keywords: [
      'chucheria',
      'galleta',
      'chocolate',
      'dulce',
      'snack',
      'papas',
      'chocorramo',
      'chocoramo',
      'chocolatina',
      'wafer',
      'cocoset',
      'gomitas',
      'ponque',
      'bocadillo',
      'mani',
      'maiz pira',
      'mantecada'
    ]
  },
  {
    category: 'Alimentación',
    subcategory: 'licores',
    keywords: [
      'licor',
      'cerveza',
      'vino',
      'ron',
      'whisky',
      'cola',
      'pola',
      'refajo',
      'embriagan',
      'pina colada',
      'aguardiente'
    ]
  },
  {
    category: 'Alimentación',
    subcategory: 'comida lista',
    keywords: ['pastel', 'hawaiano', 'hojaldre']
  },

  // VIVIENDA
  {
    category: 'Vivienda',
    subcategory: 'arriendo',
    keywords: ['arriendo', 'renta', 'alquiler']
  },
  {
    category: 'Vivienda',
    subcategory: 'agua',
    keywords: ['acueducto']
  },
  {
    category: 'Vivienda',
    subcategory: 'luz',
    keywords: ['luz', 'energia', 'electricidad']
  },
  {
    category: 'Vivienda',
    subcategory: 'gas',
    keywords: ['gasnatural', 'gasodomestico'],
    exactMatch: true // más específico para evitar conflicto con "gaseosa"
  },
  {
    category: 'Vivienda',
    subcategory: 'internet',
    keywords: ['internet', 'wifi', 'bandaancha']
  },
  {
    category: 'Vivienda',
    subcategory: 'articulos limpieza hogar',
    keywords: [
      'limpieza',
      'limp',
      'detergente',
      'det',
      'blanqueador',
      'esponja',
      'lavaloz',
      'toalla',
      'ambientador',
      'amb ele'
    ]
  },
  {
    category: 'Vivienda',
    subcategory: 'muebles y aparatos',
    keywords: ['mueble', 'electrodomestico', 'reparacion', 'silicona', 'alfombra']
  },
  {
    category: 'Vivienda',
    subcategory: 'utensilios',
    keywords: ['bolsa', 'utensilio']
  },

  // ASEO Y CUIDADO PERSONAL
  {
    category: 'Aseo y cuidado personal',
    subcategory: 'peluqueria',
    keywords: ['peluqueria', 'corte', 'cabello', 'peinado']
  },
  {
    category: 'Aseo y cuidado personal',
    subcategory: 'manicure',
    keywords: ['manicure', 'pedicure', 'unas', 'esmalte', 'remov']
  },
  {
    category: 'Aseo y cuidado personal',
    subcategory: 'articulos aseo personal',
    keywords: [
      'protectores',
      'shampoo',
      'desodorante',
      'papelhigienico',
      'higieni',
      'cepillo',
      'algodon',
      'dental',
      'tocador',
      'seda',
      'talco',
      'copitos'
    ],
    exactMatch: true // palabras específicas, solo como palabra completa
  }
];

// Las expresiones se compilan una sola vez al cargar el módulo
type CompiledKeyword = { pattern: RegExp; length: number };

const compileKeyword = (keyword: string, forceWholeWord: boolean): CompiledKeyword => {
  const normalized = normalizeText(keyword);
  const wholeWord = forceWholeWord || normalized.length <= WHOLE_WORD_MAX_LENGTH;
  const tail = wholeWord ? '(?:$|[^a-z0-9])' : '';
  return {
    pattern: new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalized)}${tail}`),
    length: normalized.length
  };
};

const COMPILED_RULES = RULES.map((rule) => ({
  category: rule.category,
  subcategoryKey: normalizeText(rule.subcategory),
  exactMatch: Boolean(rule.exactMatch),
  keywords: rule.keywords.map((k) => compileKeyword(k, Boolean(rule.exactMatch)))
}));

// ============================================================
// CATEGORIZACIÓN
// ============================================================

export const categorizeExpense = (
  description: string,
  categories: CategoryDropdown[]
): { categoryId: number | null; subcategoryId: number | null } => {
  if (!description) {
    return { categoryId: null, subcategoryId: null };
  }

  const text = normalizeText(extractProductName(description));

  const mainCategories = categories
    .filter((cat) => MAIN_CATEGORIES.includes(cat.label))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (mainCategories.length === 0) {
    return {
      categoryId: categories[0]?.value || null,
      subcategoryId: categories[0]?.subcategories?.[0]?.value || null
    };
  }

  let best: { categoryId: number; subcategoryId: number; score: number } | null = null;

  for (const rule of COMPILED_RULES) {
    const category = mainCategories.find((c) => c.label === rule.category);
    if (!category) continue;

    const subcategory = category.subcategories?.find((s) =>
      normalizeText(s.label).includes(rule.subcategoryKey)
    );
    if (!subcategory) continue;

    for (const keyword of rule.keywords) {
      if (!keyword.pattern.test(text)) continue;

      const score = keyword.length + (rule.exactMatch ? EXACT_RULE_BONUS : 0);
      // '>' estricto: en empate se queda la regla que aparece primero
      if (!best || score > best.score) {
        best = { categoryId: category.value, subcategoryId: subcategory.value, score };
      }
    }
  }

  if (best) {
    return { categoryId: best.categoryId, subcategoryId: best.subcategoryId };
  }

  // Sin coincidencias: primera categoría principal y su subcategoría Mercado
  // (buscada por nombre, no por posición en la lista).
  const defaultCategory = mainCategories[0];
  const fallback =
    defaultCategory.subcategories?.find((s) =>
      normalizeText(s.label).includes(FALLBACK_SUBCATEGORY)
    ) ?? defaultCategory.subcategories?.[0];

  return {
    categoryId: defaultCategory.value || null,
    subcategoryId: fallback?.value || null
  };
};
