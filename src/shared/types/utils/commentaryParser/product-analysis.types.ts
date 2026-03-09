// Parseo de productos
export interface ProductPrice {
  // — Campos base —
  cost: number; // Costo total pagado (siempre disponible)
  product: string; // Nombre del producto parseado
  quantity: number; // Cantidad en kg o unidades
  pricePerKg: number; // Precio por kg / precio por unidad (con descuento si aplica)
  date: string; // Fecha del gasto (YYYY-MM-DD)

  // — Campos opcionales —
  store?: string; // Tienda donde se compró [Carulla], [D1], etc.
  unit?: 'kg' | 'un'; // Unidad de medida explícita

  // — Descuento (cuando el comentario incluye "antes $X/kg, -Y%") —
  originalPricePerKg?: number; // Precio antes del descuento
  discountPercent?: number; // Porcentaje de descuento (ej: 30)

  // — Flags de calidad del dato —
  isWeighed?: boolean; // true = se vende por peso (kg), false = por unidad
  isIncomplete?: boolean; // true = el comentario no tenía kg ni precio → dato parcial
}
