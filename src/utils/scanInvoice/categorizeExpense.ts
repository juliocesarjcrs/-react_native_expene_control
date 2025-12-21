import { CategoryDropdown } from '~/shared/types/components/modal/MultiExpenseModal.type';
// import { Category, Subcategory, ExpenseItem } from './types';

// Agregar esta función auxiliar al inicio del archivo
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Función para identificar la categoría y subcategoría de un gasto basado en su descripción
 * @param description Descripción del gasto
 * @param categories Lista de categorías disponibles
 * @returns Objeto con categoryId y subcategoryId identificados
 */
export const categorizeExpense = (
  description: string,
  categories: CategoryDropdown[]
): { categoryId: number | null; subcategoryId: number | null } => {
  if (!description) {
    return { categoryId: null, subcategoryId: null };
  }

  const descNormalized = normalizeText(description);

  // Primero buscamos en las 3 categorías principales
  const mainCategories = categories
    .filter((cat) => ['Alimentación', 'Vivienda', 'Aseo y cuidado personal'].includes(cat.label))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Si no hay categorías principales, usamos la primera disponible
  if (mainCategories.length === 0) {
    return {
      categoryId: categories[0]?.value || null,
      subcategoryId: categories[0]?.subcategories?.[0]?.value || null
    };
  }

  // 1. Alimentación (414)
  const alimentacion = mainCategories.find((c) => c.label === 'Alimentación');
  if (alimentacion) {
    // Subcategorías de alimentación con palabras clave
    const alimentacionSubcategories: { keywords: string[]; subcategory: string }[] = [
      {
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
          'harina',
          'lech'
        ],
        subcategory: 'Desayunos y cenas'
      },
      {
        keywords: [
          'proteína',
          'carne',
          'pollo',
          'pescado',
          'pechuga',
          'res',
          'tilapia',
          'res*',
          'pecho',
          'lomo',
          'trucha',
          'contramuslo',
          'sobrebarrigax',
          'sobrebarriga'
        ],
        subcategory: 'Proteinas'
      },
      {
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
        subcategory: 'Mercado'
      },
      {
        keywords: ['gaseosa', 'refresco', 'pony', 'coca', 'pepsi', 'gas'],
        subcategory: 'Gaseosas'
      },
      {
        keywords: [
          'chuchería',
          'galleta',
          'chocolate',
          'dulce',
          'snack',
          'papas',
          'chocorramo',
          'chocolatina',
          'wafer',
          'cocoset'
        ],
        subcategory: 'Chucherias'
      },
      {
        keywords: ['licor', 'cerveza', 'vino', 'ron', 'whisky', 'cola', 'pola'],
        subcategory: 'Licores'
      },
      { keywords: ['onces', 'bocadillo', 'pastel'], subcategory: 'Onces' }
    ];

    for (const sub of alimentacionSubcategories) {
      if (sub.keywords.some((keyword) => descNormalized.includes(normalizeText(keyword)))) {
        const foundSub = alimentacion.subcategories?.find((s) => s.label === sub.subcategory);
        if (foundSub) {
          return { categoryId: alimentacion.value, subcategoryId: foundSub.value };
        }
      }
    }
  }

  // 2. Vivienda (374)
  const vivienda = mainCategories.find((c) => c.label === 'Vivienda');
  if (vivienda) {
    const viviendaSubcategories: { keywords: string[]; subcategory: string }[] = [
      { keywords: ['arriendo', 'renta', 'alquiler'], subcategory: 'Arriendo' },
      { keywords: ['acueducto'], subcategory: 'Agua (Día 25)' },
      { keywords: ['luz', 'energía', 'electricidad'], subcategory: 'Luz (Día 20)' },
      { keywords: ['gas', 'gas natural', 'gasodoméstico'], subcategory: 'Gas(Día 10)' },
      { keywords: ['internet', 'wifi', 'banda ancha'], subcategory: 'Internet Hogar (Día 6)' },
      {
        keywords: [
          'limpieza',
          'limp',
          'detergente',
          'det',
          'jabón',
          'blanqueador',
          'toalla',
          'esponja',
          'lavaloz'
        ],
        subcategory: 'Artículos limpieza hogar'
      },
      {
        keywords: ['mueble', 'electrodoméstico', 'reparación', 'silicona', 'alfombra'],
        subcategory: 'Muebles y aparatos de casa+ reparaciones'
      },
      { keywords: ['bolsa'], subcategory: 'Utensilios domésticos' }
    ];

    for (const sub of viviendaSubcategories) {
      if (sub.keywords.some((keyword) => descNormalized.includes(normalizeText(keyword)))) {
        const foundSub = vivienda.subcategories?.find((s) => s.label === sub.subcategory);
        if (foundSub) {
          return { categoryId: vivienda.value, subcategoryId: foundSub.value };
        }
      }
    }
  }

  // 3. Aseo y cuidado personal (474)
  const aseo = mainCategories.find((c) => c.label === 'Aseo y cuidado personal');
  if (aseo) {
    const aseoSubcategories: { keywords: string[]; subcategory: string }[] = [
      { keywords: ['peluquería', 'corte', 'cabello', 'peinado'], subcategory: 'Peluquería' },
      {
        keywords: ['manicure', 'pedicure', 'uñas', 'esmalte', 'remov'],
        subcategory: 'Manicure y pedicure'
      },
      {
        keywords: [
          'aseo',
          'jabón',
          'shampoo',
          'crema',
          'desodorante',
          'papel higiénico',
          'toalla',
          'higieni',
          'cepillo',
          'algodon',
          'hume',
          'toal',
          'dental',
          'protectores'
        ],
        subcategory: 'Artículos aseo personal'
      }
    ];

    for (const sub of aseoSubcategories) {
      if (sub.keywords.some((keyword) => descNormalized.includes(normalizeText(keyword)))) {
        const foundSub = aseo.subcategories?.find((s) => s.label === sub.subcategory);
        if (foundSub) {
          return { categoryId: aseo.value, subcategoryId: foundSub.value };
        }
      }
    }
  }

  // Si no encontramos coincidencia, usamos la primera categoría principal y su segunda subcategoría8(Mercados)
  return {
    categoryId: mainCategories[0]?.value || null,
    subcategoryId: mainCategories[0]?.subcategories?.[1]?.value || null
  };
};
