import { useState, useCallback } from 'react';

interface UseProductExpansionReturn {
  expandedProducts: Set<string>;
  toggleExpanded: (productKey: string) => void;
  isExpanded: (productKey: string) => boolean;
  collapseAll: () => void;
  expandAll: (productKeys: string[]) => void;
}

/**
 * Hook para manejar el estado de expansión de cards de productos.
 * Permite abrir/cerrar el detalle de compras de cada producto.
 */
export const useProductExpansion = (): UseProductExpansionReturn => {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((productKey: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productKey)) {
        next.delete(productKey);
      } else {
        next.add(productKey);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (productKey: string) => expandedProducts.has(productKey),
    [expandedProducts]
  );

  const collapseAll = useCallback(() => {
    setExpandedProducts(new Set());
  }, []);

  const expandAll = useCallback((productKeys: string[]) => {
    setExpandedProducts(new Set(productKeys));
  }, []);

  return {
    expandedProducts,
    toggleExpanded,
    isExpanded,
    collapseAll,
    expandAll
  };
};
