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
