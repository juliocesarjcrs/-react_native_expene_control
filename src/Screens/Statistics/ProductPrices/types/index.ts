import { ProductPrice } from '~/shared/types/screens/Statistics/commentary-analysis.types';

/**
 * Resumen agregado de un producto (agrupado por nombre normalizado)
 */
export interface ProductSummary {
  name: string;
  normalizedName: string;
  count: number;
  isWeighed: boolean;
  unit: 'kg' | 'un';
  // Para completos: precio promedio real
  avgPrice: number;
  best: ProductPrice | null;
  worst: ProductPrice | null;
  savings: number;
  // Para incompletos: costo total acumulado
  totalCost: number;
  // Tiendas únicas donde se compró
  stores: string[];
}

/**
 * Productos agrupados por nombre normalizado
 */
export interface GroupedProducts {
  [normalizedName: string]: ProductPrice[];
}

/**
 * Modo del modal de detalle
 */
export type PurchaseModalMode = 'view' | 'edit';

/**
 * Props para callbacks de actualización
 */
export interface PurchaseUpdateCallbacks {
  onSave: (updated: ProductPrice) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}
