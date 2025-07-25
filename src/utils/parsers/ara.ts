/* eslint-disable no-useless-escape */
import { Product } from "~/shared/types/components/receipt-scanner.type";
import { formatDescription } from "./formatDescription";

export function parseAra(lines: string[]): Product[] {
  console.log("📄 Procesando como tipo Ara...");

  const products: Product[] = [];
  const productLineRegex = /^\d+\s+([A-Z\s\.*\/()]+)\s+([\d\s\.]+)\s+[A-Z]$/;

  for (const line of lines) {
    const match = line.match(productLineRegex);
    if (match) {
      const rawDescription = match[1].trim();
      const rawPrice = match[2].replace(/\s/g, '');

      // Format the description (assuming formatDescription exists)
      const description = formatDescription(rawDescription.replace(/\./g, ''));

      const price = parseInt(rawPrice.replace(/\./g, ''));

      if (!isNaN(price)) {
        products.push({ description, price });
      }
    }
  }

  return products;
}