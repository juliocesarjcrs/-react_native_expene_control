import { Product } from "~/shared/types/components/receipt-scanner.type";
import { formatDescription } from "./formatDescription";

export function parseCarulla(lines: string[], joined:string): Product[] {
  const products: Product[] = [];
   let match;
   console.log("📄 Procesando como tipo Carulla... lines.length", lines.length);

    for (let i = 0; i < lines.length; i++) {
      const current = lines[i];
      const next = lines[i + 1]?.trim();

      const unitLineMatch = current.match(/1\/u.*?(\d{1,3}(?:[.,]\d{3})).*?(\d{1,3}(?:[.,]\d{3}))$/);
      const descLineMatch = next?.match(/^(\d{6,})\s+(.+)/);

      if (unitLineMatch && descLineMatch) {
        const price = parseInt(unitLineMatch[2].replace(/[.,]/g, ''), 10);
        const description = descLineMatch[2].trim();
        products.push({ description: formatDescription(description), price });
        i++;
        continue;
      }

      const inlineMatch = current.match(/^(\d{6,})\s+(.+?)\s+(\d{1,3}(?:[.,]\d{3}))$/);
      if (inlineMatch) {
        const description = inlineMatch[2].trim();
        const price = parseInt(inlineMatch[3].replace(/[.,]/g, ''), 10);
        products.push({ description: formatDescription(description), price });
        continue;
      }

      const splitDescMatch = current.match(/^(\d{6,})\s+(.+)$/);
      const nextPriceMatch = next?.match(/^(\d{1,3}(?:[.,]\d{3}))$/);
      if (splitDescMatch && nextPriceMatch) {
        const description = splitDescMatch[2].trim();
        const price = parseInt(nextPriceMatch[1].replace(/[.,]/g, ''), 10);
        products.push({ description: formatDescription(description), price });
        i++;
        continue;
      }
      const exitoInlineMatch = current.match(/^(\d{6,})\s+(.+?)\s+(\d{1,3}[.,]\d{3})[A-Z]?$/);
      if (exitoInlineMatch) {
        const description = exitoInlineMatch[2].trim();
        const price = parseInt(exitoInlineMatch[3].replace(/[.,]/g, ''), 10);
        products.push({ description: formatDescription(description), price });
        continue;
      }
    }

    const carullaInlineRegex = /\d+\s+1\/u\s+x\s+[\d.,]+\s+V\s*\.?\s*Ahorro\s+\d+\s+(\d{6,})\s+([A-ZÁÉÍÓÚÑa-záéíóúñ().,/\- ]{3,})\s+(\d{1,3}(?:[.,]\d{3}))[A-Z]?/g;
    let matchInline;
    while ((matchInline = carullaInlineRegex.exec(joined)) !== null) {
      const [, , descriptionRaw, priceRaw] = matchInline;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
      const price = parseInt(priceRaw.replace(/[.,]/g, ''), 10);
      if (!products.find(p => p.description === description && p.price === price)) {
        products.push({ description: formatDescription(description), price });
      }
    }

    // Heurística adicional para productos pesables de Carulla
    if (products.length === 0) {

      const regex = /\d+\s+[0-9.,\s]+\/KGM\s+x\s+[0-9.,\s]+\s+V\.\s+Ahorro\s+[0-9.,\s]+\s+(\d{3,6})\s+([A-Za-zÁÉÍÓÚÜÑñ().,/\- ]{3,})\s+(\d{1,3}(?:[.,]\s?\d{3}))/gi;


      while ((match = regex.exec(joined)) !== null) {
        const [, , descriptionRaw, priceRaw] = match;
        const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
        const price = parseInt(priceRaw.replace(/[.,\s]/g, ''), 10);
        products.push({ description: formatDescription(description), price });
      }
    }
  return products;
}