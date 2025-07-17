import { Product } from "~/shared/types/components/receipt-scanner.type";
import { formatDescription } from "./formatDescription";

export function parseGeneric(lines: string[], joined: string): Product[] {
  const products: Product[] = [];
      console.log("🧠 Procesando con heurística genérica (sin encabezados)...");

    // Encuentra todos los precios y sus posiciones
    const priceRegex = /\$?\s?(\d{1,3}(?:[.,]\d{3})+)(?:,\d{2})?/g;
    const matches: { price: number, index: number, length: number }[] = [];
    let priceMatch;
    while ((priceMatch = priceRegex.exec(joined)) !== null) {
      const price = parseInt(priceMatch[1].replace(/[.,]/g, ''), 10);
      if (price > 50 && price < 1000000) {
        matches.push({ price, index: priceMatch.index, length: priceMatch[0].length });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index + matches[i].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : joined.length;
      const fragment = joined.slice(start, end);

      // Busca todas las secuencias tipo producto ignorando cantidades y "Und."
      const descRegex = /(?:\d+\s+)?(?:Und\.?\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ().,/\- ]{3,}?)(?=\s+(?:Und\.?|$))/g;
      let descMatch;
      while ((descMatch = descRegex.exec(fragment)) !== null) {
        const description = descMatch[1]
          .replace(/\s{2,}/g, ' ')
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase());

        // Filtra encabezados y descripciones vacías o muy cortas
        if (
          description.length > 2 &&
          !/^(precio|cantidad|producto|un|und|total|item|subtotal|descuento|ahorro|valor|pago|otro|forma de pago|pagado|cambio)/i.test(description) &&
          !products.find(p => p.description === description && p.price === matches[i].price)
        ) {
          products.push({ description: formatDescription(description), price: matches[i].price });
        }
      }
    }
    if (products.length === 0) {
      console.warn("⚠️ Ningún producto detectado con heurística.");
    }
  return products
}