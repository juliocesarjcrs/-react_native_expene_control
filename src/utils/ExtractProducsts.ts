import { Product } from "~/shared/types/components/receipt-scanner.type";

export function extractProducts(ocr: string): Product[] {
  const products: Product[] = [];

  const lines = ocr
    .split(/\r?\n/)
    .map(l => l.replace(/\t/g, ' ').trim())
    .filter(Boolean);

  const joined = lines.join(' ');
  const isD1 = ocr.includes('CAN') || ocr.includes('DESCRIPCION');
  const isCarulla = ocr.includes('PLU') || ocr.includes('DETALLE');

  console.log("🧾 OCR:", joined.slice(0, 300));
  console.log("🔍 isD1:", isD1);
  console.log("🔍 isCarulla:", isCarulla);

  let match;

  if (isD1) {
    console.log("📄 Procesando como tipo D1...");
    const regex = /(\d{1,3}(?:[.,]\d{3}))\s+(\d{13})\s+([A-ZÁÉÍÓÚÑ/\- ]{3,})(?:\s+(\d{1,3}(?:[.,]\d{3})))?/gi;

    while ((match = regex.exec(joined)) !== null) {
      const [, price1, , descriptionRaw, price2] = match;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
      const price = parseInt((price2 || price1).replace(/[.,]/g, ''), 10);

      if (!products.find(p => p.description === description && p.price === price)) {
        products.push({ description, price });
      }
    }

  } else if (isCarulla) {
    console.log("📄 Procesando como tipo Carulla... lines.length", lines.length);

    for (let i = 0; i < lines.length; i++) {
      const current = lines[i];
      const next = lines[i + 1]?.trim();

      const unitLineMatch = current.match(/1\/u.*?(\d{1,3}(?:[.,]\d{3})).*?(\d{1,3}(?:[.,]\d{3}))$/);
      const descLineMatch = next?.match(/^(\d{6,})\s+(.+)/);

      if (unitLineMatch && descLineMatch) {
        const price = parseInt(unitLineMatch[2].replace(/[.,]/g, ''), 10);
        const description = descLineMatch[2].trim();
        products.push({ description, price });
        i++;
        continue;
      }

      const inlineMatch = current.match(/^(\d{6,})\s+(.+?)\s+(\d{1,3}(?:[.,]\d{3}))$/);
      if (inlineMatch) {
        const description = inlineMatch[2].trim();
        const price = parseInt(inlineMatch[3].replace(/[.,]/g, ''), 10);
        products.push({ description, price });
        continue;
      }

      const splitDescMatch = current.match(/^(\d{6,})\s+(.+)$/);
      const nextPriceMatch = next?.match(/^(\d{1,3}(?:[.,]\d{3}))$/);
      if (splitDescMatch && nextPriceMatch) {
        const description = splitDescMatch[2].trim();
        const price = parseInt(nextPriceMatch[1].replace(/[.,]/g, ''), 10);
        products.push({ description, price });
        i++;
        continue;
      }
      const exitoInlineMatch = current.match(/^(\d{6,})\s+(.+?)\s+(\d{1,3}[.,]\d{3})[A-Z]?$/);
      if (exitoInlineMatch) {
        const description = exitoInlineMatch[2].trim();
        const price = parseInt(exitoInlineMatch[3].replace(/[.,]/g, ''), 10);
        products.push({ description, price });
        continue;
      }
    }

    // Heurística adicional para productos pesables de Carulla
    if (products.length === 0) {
      const regex = /\d+\s+[0-9.,\s]+\/KGM\s+x\s+[0-9.,\s]+\s+V\.\s+Ahorro\s+[0-9.,\s]+\s+(\d{3,6})\s+([A-Za-zÁÉÍÓÚÜÑñ().,/\- ]{3,})\s+(\d{1,3}(?:[.,]\s?\d{3}))/gi;

      // const regex = /\d+\s+[0-9.,]+\/KGM\s+x\s+[0-9.,]+\s+V\.\s+Ahorro\s+[0-9.,]+\s+(\d{3,6})\s+([A-Za-zÁÉÍÓÚÜÑñ().,/\- ]{3,})\s+(\d{1,3}(?:[.,]\d{3}))/gi;

      while ((match = regex.exec(joined)) !== null) {
        const [, , descriptionRaw, priceRaw] = match;
        const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
        const price = parseInt(priceRaw.replace(/[.,\s]/g, ''), 10);
        products.push({ description, price });
      }
    }


  } else {
    console.log("🧠 Procesando con heurística genérica (sin encabezados)...");

    const fallbackRegex = /(\d{1,3}(?:[.,]\d{3}))\s+(\d{13})\s+([A-ZÁÉÍÓÚÑ/\- ]{3,})(?:\s+(\d{1,3}(?:[.,]\d{3})))?/gi;

    while ((match = fallbackRegex.exec(joined)) !== null) {
      const [, price1, , descriptionRaw, price2] = match;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
      const price = parseInt((price2 || price1).replace(/[.,]/g, ''), 10);

      if (!products.find(p => p.description === description && p.price === price)) {
        products.push({ description, price });
      }
    }

    if (products.length === 0) {
      console.warn("⚠️ Ningún producto detectado con heurística.");
    }
  }

  console.log(`✅ Total productos detectados: ${products.length}`);
  return products;
}
