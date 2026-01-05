import { CategoryDropdown } from '~/shared/types/components/modal/MultiExpenseModal.type';
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};
export const categorizeExpense = (
  description: string,
  categories: CategoryDropdown[]
): { categoryId: number | null; subcategoryId: number | null } => {
  if (!description) {
    return { categoryId: null, subcategoryId: null };
  }

  const descNormalized = normalizeText(description);
  const words = descNormalized.split(/\s+/);

  const mainCategories = categories
    .filter((cat) => ['Alimentación', 'Vivienda', 'Aseo y cuidado personal'].includes(cat.label))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (mainCategories.length === 0) {
    return {
      categoryId: categories[0]?.value || null,
      subcategoryId: categories[0]?.subcategories?.[0]?.value || null
    };
  }

  // Definir todas las reglas con prioridad
  const rules = [
    // ALIMENTACIÓN
    {
      category: 'Alimentación',
      subcategory: 'Desayunos y cenas',
      keywords: [
        'desayuno',
        'cena',
        'pan',
        'huevo',
        'leche',
        'queso',
        'café',
        'integral',
        'atun',
        'harina'
      ],
      exactMatch: false
    },
    {
      category: 'Alimentación',
      subcategory: 'Proteinas',
      keywords: [
        'proteina',
        'carne',
        'pollo',
        'pernil',
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
        'sobrebarriga'
      ],
      exactMatch: false
    },
    {
      category: 'Alimentación',
      subcategory: 'Mercado',
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
      ],
      exactMatch: false
    },
    {
      category: 'Alimentación',
      subcategory: 'Gaseosas',
      keywords: ['gaseosa', 'refresco', 'pony', 'coca', 'pepsi', 'gas'],
      exactMatch: false
    },
    {
      category: 'Alimentación',
      subcategory: 'Chucherias',
      keywords: [
        'chucheria',
        'galleta',
        'chocolate',
        'dulce',
        'snack',
        'papas',
        'chocorramo',
        'chocolatina',
        'wafer',
        'cocoset',
        'gomitas'
      ],
      exactMatch: false
    },
    {
      category: 'Alimentación',
      subcategory: 'Licores',
      keywords: ['licor', 'cerveza', 'vino', 'ron', 'whisky', 'cola', 'pola', 'refajo'],
      exactMatch: false
    },
    {
      category: 'Alimentación',
      subcategory: 'Onces',
      keywords: ['onces', 'bocadillo', 'pastel'],
      exactMatch: false
    },

    // VIVIENDA
    {
      category: 'Vivienda',
      subcategory: 'Arriendo',
      keywords: ['arriendo', 'renta', 'alquiler'],
      exactMatch: false
    },
    {
      category: 'Vivienda',
      subcategory: 'Agua (Día 25)',
      keywords: ['acueducto'],
      exactMatch: false
    },
    {
      category: 'Vivienda',
      subcategory: 'Luz (Día 20)',
      keywords: ['luz', 'energia', 'electricidad'],
      exactMatch: false
    },
    {
      category: 'Vivienda',
      subcategory: 'Gas(Día 10)',
      keywords: ['gasnatural', 'gasodomestico'],
      exactMatch: true // Más específico para evitar conflicto con "gaseosa"
    },
    {
      category: 'Vivienda',
      subcategory: 'Internet Hogar (Día 6)',
      keywords: ['internet', 'wifi', 'bandaancha'],
      exactMatch: false
    },
    {
      category: 'Vivienda',
      subcategory: 'Artículos limpieza hogar',
      keywords: ['limpieza', 'limp', 'detergente', 'det', 'blanqueador', 'esponja', 'lavaloz'],
      exactMatch: false
    },
    {
      category: 'Vivienda',
      subcategory: 'Muebles y aparatos de casa+ reparaciones',
      keywords: ['mueble', 'electrodomestico', 'reparacion', 'silicona', 'alfombra'],
      exactMatch: false
    },
    {
      category: 'Vivienda',
      subcategory: 'Utensilios domésticos',
      keywords: ['bolsa', 'utensilio'],
      exactMatch: false
    },

    // ASEO Y CUIDADO PERSONAL (con mayor prioridad para palabras específicas)
    {
      category: 'Aseo y cuidado personal',
      subcategory: 'Peluquería',
      keywords: ['peluqueria', 'corte', 'cabello', 'peinado'],
      exactMatch: false
    },
    {
      category: 'Aseo y cuidado personal',
      subcategory: 'Manicure y pedicure',
      keywords: ['manicure', 'pedicure', 'unas', 'esmalte', 'remov'],
      exactMatch: false
    },
    {
      category: 'Aseo y cuidado personal',
      subcategory: 'Artículos aseo personal',
      keywords: [
        'protectores',
        'shampoo',
        'desodorante',
        'papelhigienico',
        'higieni',
        'cepillo',
        'algodon',
        'dental'
      ],
      exactMatch: true // Palabras más específicas con coincidencia exacta
    }
  ];

  // Calcular puntuación para cada regla
  type Match = {
    categoryId: number;
    subcategoryId: number;
    score: number;
    matchLength: number;
  };

  const matches: Match[] = [];

  for (const rule of rules) {
    const category = mainCategories.find((c) => c.label === rule.category);
    if (!category) continue;

    const subcategory = category.subcategories?.find((s) => s.label === rule.subcategory);
    if (!subcategory) continue;

    for (const keyword of rule.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      let isMatch = false;
      let matchLength = 0;

      if (rule.exactMatch) {
        // Coincidencia exacta: buscar la palabra completa
        isMatch = words.includes(normalizedKeyword);
        matchLength = normalizedKeyword.length;
      } else {
        // Coincidencia parcial: buscar en toda la descripción
        isMatch = descNormalized.includes(normalizedKeyword);
        matchLength = normalizedKeyword.length;
      }

      if (isMatch) {
        // Puntuación: longitud de la palabra + bonus por coincidencia exacta
        const score = matchLength + (rule.exactMatch ? 100 : 0);

        matches.push({
          categoryId: category.value,
          subcategoryId: subcategory.value,
          score,
          matchLength
        });
      }
    }
  }

  // Si hay coincidencias, retornar la de mayor puntuación
  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score);
    const best = matches[0];
    return {
      categoryId: best.categoryId,
      subcategoryId: best.subcategoryId
    };
  }

  // Default: primera categoría, segunda subcategoría
  return {
    categoryId: mainCategories[0]?.value || null,
    subcategoryId: mainCategories[0]?.subcategories?.[1]?.value || null
  };
};
