import { ProductPrice } from '~/shared/types/utils/commentaryParser/commentary-analysis.types';
import { NumberFormat } from '~/utils/Helpers';

/**
 * Devuelve el sufijo de unidad basado en el campo `unit` del producto.
 * Fallback a isWeighed si unit no está presente (datos antiguos).
 */
export const getUnitLabel = (product: ProductPrice): string => {
  if (product.unit) return `/${product.unit}`;
  return product.isWeighed ? '/kg' : '/un';
};

/**
 * Formatea precio con su unidad correspondiente
 */
export const formatPrice = (price: number, product: ProductPrice): string => {
  return `${NumberFormat(price)}${getUnitLabel(product)}`;
};

/**
 * Normaliza texto para búsqueda (minúsculas, sin tildes)
 */
export const normalizeSearchText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};
