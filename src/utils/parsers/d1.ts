import { Product } from "~/shared/types/components/receipt-scanner.type";
import { formatDescription } from "./formatDescription";

export function parseD1(lines: string[], joined: string): Product[] {
  console.log("📄 Procesando como tipo D1...");
  const products: Product[] = [];
  let match;
  const regex = /(\d{1,3}(?:[.,]\s?\d{3})*(?:[.,]\s?\d{1,3})?)\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ/\- ]{3,})(?:\s+(\d{1,3}(?:[.,]\s?\d{3})*(?:[.,]\s?\d{1,3})?))?(?:\s+[A-Z]\s*\.)?/gi;
  while ((match = regex.exec(joined)) !== null) {
    const [, price1, code, descriptionRaw, price2] = match;
    const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
    // Prefer price2 if exists, otherwise use price1
    let priceString = (price2 || price1).replace(/[.,\s]/g, '');

    // Special handling for cases where the price appears before the code
    if (parseInt(priceString, 10) < 10 && code && code.length >= 8) {
      const altPriceMatch = joined.match(new RegExp(`${code}\\s+([\\d.,]+)`));
      if (altPriceMatch && altPriceMatch[1]) {
        priceString = altPriceMatch[1].replace(/[.,]/g, '');
      }
    }
    const price = parseInt(priceString, 10);

    if (!isNaN(price)) {
      if (!products.find(p => p.description === description && p.price === price)) {
        products.push({ description: formatDescription(description), price });
      }
    }
  }

  if (products.length === 0) {
    // Regex para líneas tipo "2, 10 70842579 JABON VELIEADO   2,00 A."
    const d1LooseRegex = /(\d{1,3}[.,]\s?\d{1,3})\s+\d+\s+([A-ZÁÉÍÓÚÑa-záéíóúñ().,/\- ]{3,})\s+(\d{1,3}[.,]\d{1,3})/g;
    let matchLoose;
    while ((matchLoose = d1LooseRegex.exec(joined)) !== null) {
      const [, , descriptionRaw, priceRaw] = matchLoose;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
      let price = 0;
      // Normaliza el precio: "2,00" o "2.00" => 200
      const cleanPrice = priceRaw.replace(/\s/g, '');
      if (/^\d{1,3}[.,]\d{2}$/.test(cleanPrice)) {
        price = parseInt(cleanPrice.replace(/[.,]/, ''), 10);
      } else {
        price = parseInt(cleanPrice.replace(/[.,]/g, ''), 10);
      }
      if (!products.find(p => p.description === description && p.price === price)) {
        products.push({ description: formatDescription(description), price });
      }
    }

  }
  return products
}