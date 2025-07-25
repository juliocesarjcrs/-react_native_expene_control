/* eslint-disable no-useless-escape */
import { Product } from "~/shared/types/components/receipt-scanner.type";
import { formatDescription } from "./formatDescription";

export function parseGeneric(lines: string[], joined: string): Product[] {
  // const products: Product[] = [];
  console.log("🧠 Procesando con heurística genérica (sin encabezados)...");

  // Primero intentamos el patrón de productos con precios en columnas
  const columnProducts = tryColumnFormat(lines, joined);
  if (columnProducts.length > 0) {
    return columnProducts;
  }

  // Si no encontramos productos en formato de columnas, aplicamos la heurística general
  return fallbackHeuristicProcessing(joined);
}

function tryColumnFormat(lines: string[], joined: string): Product[] {
  const products: Product[] = [];

  // Patrón para formato de columnas (ej: Producto Cant Unit Total)
  const columnHeaderPattern = /(Producto|Descripción|Item)\s+(Cant|Cantidad|Qty)?\s*(Unit|Precio|Valor Unitario)?\s*(Total|Valor)?/i;

  if (columnHeaderPattern.test(joined)) {
    console.log("📊 Detectado posible formato de columnas");

    // Patrón para líneas de producto en formato de columnas
    const productLinePattern = /^([A-ZÁÉÍÓÚÑa-záéíóúñ().,\/\- ]+?)\s+(?:\d+[.,]?\d*\s+)?(\d+[.,]\d{3})(?:\s+\d+[.,]\d{3})?/im;
    for (const line of lines) {
      const match = line.match(productLinePattern);
      if (match) {
        const description = formatDescription(match[1].trim());
        // Tomamos el primer precio encontrado (que debería ser el unitario)
        const priceStr = match[2] || match[3];

        if (priceStr) {
          const price = parseInt(priceStr.replace(/[.,]/g, ''), 10);
          if (price > 50 && price < 1000000) {
            products.push({ description, price });
          }
        }
      }
    }
  }

  return products;
}

function fallbackHeuristicProcessing(joined: string): Product[] {
  const products: Product[] = [];

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
      const description = formatDescription(descMatch[1]
        .replace(/\s{2,}/g, ' ')
        .trim());

      // Filtra encabezados y descripciones vacías o muy cortas
      if (
        description.length > 2 &&
        !/^(precio|cantidad|producto|un|und|total|item|subtotal|descuento|ahorro|valor|pago|otro|forma de pago|pagado|cambio)/i.test(description) &&
        !products.find(p => p.description === description && p.price === matches[i].price)
      ) {
        products.push({ description, price: matches[i].price });
      }
    }
  }

  if (products.length === 0) {
    console.warn("⚠️ Ningún producto detectado con heurística.");
  }

  return products;
}