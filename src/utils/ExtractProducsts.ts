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
          products.push({ description, price });
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
          products.push({ description, price });
        }
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

    const carullaInlineRegex = /\d+\s+1\/u\s+x\s+[\d.,]+\s+V\s*\.?\s*Ahorro\s+\d+\s+(\d{6,})\s+([A-ZÁÉÍÓÚÑa-záéíóúñ().,/\- ]{3,})\s+(\d{1,3}(?:[.,]\d{3}))[A-Z]?/g;
    let matchInline;
    while ((matchInline = carullaInlineRegex.exec(joined)) !== null) {
      const [, , descriptionRaw, priceRaw] = matchInline;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
      const price = parseInt(priceRaw.replace(/[.,]/g, ''), 10);
      if (!products.find(p => p.description === description && p.price === price)) {
        products.push({ description, price });
      }
    }

    // Heurística adicional para productos pesables de Carulla
    if (products.length === 0) {

      const regex = /\d+\s+[0-9.,\s]+\/KGM\s+x\s+[0-9.,\s]+\s+V\.\s+Ahorro\s+[0-9.,\s]+\s+(\d{3,6})\s+([A-Za-zÁÉÍÓÚÜÑñ().,/\- ]{3,})\s+(\d{1,3}(?:[.,]\s?\d{3}))/gi;


      while ((match = regex.exec(joined)) !== null) {
        const [, , descriptionRaw, priceRaw] = match;
        const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
        const price = parseInt(priceRaw.replace(/[.,\s]/g, ''), 10);
        products.push({ description, price });
      }
    }


  } else {
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
          products.push({ description, price: matches[i].price });
        }
      }
    }
    if (products.length === 0) {
      console.warn("⚠️ Ningún producto detectado con heurística.");
    }
  }
  const productsFormated = products.map((product) => {
    return {
      description: formatDescription(product.description),
      price: product.price

    }
  });
  return productsFormated
}

const formatDescription = (desc: string): string => {
  return desc
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}