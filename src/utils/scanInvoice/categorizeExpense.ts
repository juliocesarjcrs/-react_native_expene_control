// categorizeExpense.ts
import { CategoryDropdown } from '~/shared/types/components/modal/MultiExpenseModal.type';
// import { Category, Subcategory, ExpenseItem } from './types';

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

  const descLower = description.toLowerCase();

  // Primero buscamos en las 3 categorías principales
  const mainCategories = categories
    .filter(cat => ['Alimentación', 'Vivienda', 'Aseo y cuidado personal'].includes(cat.label))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Si no hay categorías principales, usamos la primera disponible
  if (mainCategories.length === 0) {
    return {
      categoryId: categories[0]?.value || null,
      subcategoryId: categories[0]?.subcategories?.[0]?.value || null
    };
  }

  // 1. Alimentación (414)
  const alimentacion = mainCategories.find(c => c.label === 'Alimentación');
  if (alimentacion) {
    // Subcategorías de alimentación con palabras clave
    const alimentacionSubcategories: { keywords: string[]; subcategory: string }[] = [
      { keywords: ['desayuno', 'cena', 'pan', 'huevo', 'leche', 'queso', 'café', 'integral'], subcategory: 'Desayunos y cenas' },
      { keywords: ['mercado', 'fruta', 'verdura', 'arroz', 'papa', 'cebolla', 'tomate', 'zanahoria'], subcategory: 'Mercado' },
      { keywords: ['proteína', 'carne', 'pollo', 'pescado', 'pechuga', 'res', 'tilapia'], subcategory: 'Proteinas' },
      { keywords: ['gaseosa', 'refresco', 'pony', 'coca', 'pepsi'], subcategory: 'Gaseosas' },
      { keywords: ['chuchería', 'galleta', 'chocolate', 'dulce', 'snack', 'papas'], subcategory: 'Chucherias' },
      { keywords: ['licor', 'cerveza', 'vino', 'ron', 'whisky'], subcategory: 'Licores' },
      { keywords: ['onces', 'bocadillo', 'pastel'], subcategory: 'Onces' }
    ];

    for (const sub of alimentacionSubcategories) {
      if (sub.keywords.some(keyword => descLower.includes(keyword))) {
        const foundSub = alimentacion.subcategories?.find(s => s.label === sub.subcategory);
        if (foundSub) {
          return { categoryId: alimentacion.value, subcategoryId: foundSub.value };
        }
      }
    }
  }

  // 2. Vivienda (374)
  const vivienda = mainCategories.find(c => c.label === 'Vivienda');
  if (vivienda) {
    const viviendaSubcategories: { keywords: string[]; subcategory: string }[] = [
      { keywords: ['arriendo', 'renta', 'alquiler'], subcategory: 'Arriendo' },
      { keywords: ['agua', 'acueducto'], subcategory: 'Agua (Día 25)' },
      { keywords: ['luz', 'energía', 'electricidad'], subcategory: 'Luz (Día 20)' },
      { keywords: ['gas', 'gas natural', 'gasodoméstico'], subcategory: 'Gas(Día 10)' },
      { keywords: ['internet', 'wifi', 'banda ancha'], subcategory: 'Internet Hogar (Día 6)' },
      { keywords: ['limpieza', 'detergente', 'jabón', 'blanqueador', 'toalla'], subcategory: 'Artículos limpieza hogar' },
      { keywords: ['mueble', 'electrodoméstico', 'reparación', 'silicona', 'alfombra'], subcategory: 'Muebles y aparatos de casa+ reparaciones' }
    ];

    for (const sub of viviendaSubcategories) {
      if (sub.keywords.some(keyword => descLower.includes(keyword))) {
        const foundSub = vivienda.subcategories?.find(s => s.label === sub.subcategory);
        if (foundSub) {
          return { categoryId: vivienda.value, subcategoryId: foundSub.value };
        }
      }
    }
  }

  // 3. Aseo y cuidado personal (474)
  const aseo = mainCategories.find(c => c.label === 'Aseo y cuidado personal');
  if (aseo) {
    const aseoSubcategories: { keywords: string[]; subcategory: string }[] = [
      { keywords: ['peluquería', 'corte', 'cabello', 'peinado'], subcategory: 'Peluquería' },
      { keywords: ['manicure', 'pedicure', 'uñas', 'esmalte'], subcategory: 'Manicure y pedicure' },
      { keywords: ['aseo', 'jabón', 'shampoo', 'crema', 'desodorante', 'papel higiénico', 'toalla'], subcategory: 'Artículos aseo personal' }
    ];

    for (const sub of aseoSubcategories) {
      if (sub.keywords.some(keyword => descLower.includes(keyword))) {
        const foundSub = aseo.subcategories?.find(s => s.label === sub.subcategory);
        if (foundSub) {
          return { categoryId: aseo.value, subcategoryId: foundSub.value };
        }
      }
    }
  }

  // Si no encontramos coincidencia, usamos la primera categoría principal y su primera subcategoría
  return {
    categoryId: mainCategories[0]?.value || null,
    subcategoryId: mainCategories[0]?.subcategories?.[0]?.value || null
  };
};