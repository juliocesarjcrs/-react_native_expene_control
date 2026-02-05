export type SubcategoryFormat = {
  name: string;
  id: number;
  total: number;
};

// Tipo para las categorías
export type CategoryFormat = {
  label: string;
  subcategories: SubcategoryFormat[];
  value: number;
};

/**
 * Tipo para cuando se selecciona una subcategoría
 * Incluye información completa de la subcategoría y su categoría padre
 */
export type SubcategorySelection = {
  label: string; // Nombre de la subcategoría
  value: number; // ID de la subcategoría
  categoryId: number; // ID de la categoría padre
  categoryName: string; // Nombre de la categoría padre
};

/**
 * Tipo para cuando se selecciona solo una categoría (sin subcategoría)
 */
export type CategorySelection = {
  id: number | null; // ID de la categoría
  label: string; // Nombre de la categoría
};
