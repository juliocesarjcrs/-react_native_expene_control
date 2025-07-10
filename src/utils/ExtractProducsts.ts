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
    const regex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,3})?)\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ/\- ]{3,})(?:\s+(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,3})?))?(?:\s+[A-Z]\s*\.)?/gi;

    while ((match = regex.exec(joined)) !== null) {
        const [, price1, code, descriptionRaw, price2] = match;
        const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
        // Prefer price2 if exists, otherwise use price1
        let priceString = (price2 || price1).replace(/[.,]/g, '');

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


export const extractProducts2 = (text: string): Product[] => {
  // Normalizar el texto: eliminar múltiples espacios, tabs y normalizar saltos de línea
  const normalizedText = text
    .replace(/\t/g, ' ') // Reemplazar tabs por espacios
    .replace(/\s+/g, ' ') // Múltiples espacios por uno solo
    .replace(/,/g, '.') // Normalizar decimales
    .trim();

  if (isCarullaReceipt(normalizedText)) {
    return parseCarullaReceipt(normalizedText);
  } else if (isD1Receipt(normalizedText)) {
    return parseD1Receipt(normalizedText);
  }
  return [];
};

// Detectar recibos de Carulla
const isCarullaReceipt = (text: string): boolean => {
  return text.includes('PLU') || text.includes('DETALLE');
  // return /PLU\s+DETALLE\s+PRECIO/i.test(text) || 
  //        /DETALLE\s+PRECIO\s+PLU/i.test(text) ||
  //        /PRECIO\s+PLU\s+DETALLE/i.test(text) ||
  //        /Total Item\s*:\s*\d+/i.test(text);
};

// Detectar recibos de D1
const isD1Receipt = (text: string): boolean => {
  return text.includes('CAN') || text.includes('DESCRIPCION');
  // return /CAN\s+UM\s+VALOR\s+U/i.test(text) || 
  //        /CODIGO\s+DESCRIPCION\s+VALOR/i.test(text) ||
  //        /VALOR\s+U\s+CODIGO/i.test(text);
};

// Parsear recibos de Carulla
const parseCarullaReceipt = (text: string): Product[] => {
  const lines = text.split('\n');
  const items: Product[] = [];

  // Expresiones regulares para diferentes formatos de Carulla
  const regexPatterns = [
    // Formato 1: "1/u x 4.578 V . Ahorro 229 647588 GALLETA WAFER SI 4.349A"
    /(?:\d+\s+)?(?:\d+\/u\sx\s[\d.]+\sV\s?\.?\s?Ahorro\s[\d.]+\s)?(?:\d+\s+)?([A-Z][A-Za-z\sÁÉÍÓÚÑ]+?)\s+(\d{1,3}(?:\.\d{3})*(?:\.\d{1,2})?)\s*A?$/i,

    // Formato 2: "1/u x 16.900 V. Ahorro 3.000 13.900 3616630 Protectores Diar"
    /(?:\d+\/u\sx\s[\d.]+\sV\s?\.?\s?Ahorro\s[\d.]+\s)?(\d{1,3}(?:\.\d{3})*(?:\.\d{1,2})?)\s+(?:\d+\s+)?([A-Z][A-Za-z\sÁÉÍÓÚÑ]+?)\s*$/i,

    // Formato 3 (tipo factura): "172836 Huevo Napoles De 23.000"
    /(?:\d+\s+)?([A-Z][A-Za-z\sÁÉÍÓÚÑ]+?)\s+(\d{1,3}(?:\.\d{3})*(?:\.\d{1,2})?)\s*$/i
  ];

  for (const line of lines) {
    if (!line.trim() || line.includes('Total Item') || line.includes('PLU') ||
      line.includes('DETALLE') || line.includes('PRECIO') || line.includes('SUBTOTAL')) {
      continue;
    }

    for (const pattern of regexPatterns) {
      const match = line.match(pattern);
      if (match) {
        let description, priceStr;

        if (match.length === 3) {
          // Patrones donde la descripción viene primero
          description = match[1].trim();
          priceStr = match[2];
        } else {
          // Patrones donde el precio viene primero
          description = match[2].trim();
          priceStr = match[1];
        }

        const price = parseFloat(priceStr.replace(/\./g, ''));

        if (!isNaN(price) && description && !description.match(/^\d/)) {
          items.push({ description, price });
          break; // Si encontramos un patrón que coincide, pasamos a la siguiente línea
        }
      }
    }
  }

  return items;
};

// Parsear recibos de D1
const parseD1Receipt = (text: string): Product[] => {
  const lines = text.split('\n');
  const items: Product[] = [];

  // Expresiones regulares para diferentes formatos de D1
  const regexPatterns = [
    // Formato 1: "10 1 IN 2300 7700304378074 CREMA DE LECH —2:300"
    /(?:\d+\s+)?(?:[^\w]*)([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ\s\/\-]+?)\s*[—\-]\s*(\d{1,3}(?:[:\.]\d{3})*(?:\.\d{1,2})?)\s*$/i,

    // Formato 2 (tipo factura): "1 UN 2,300 7700304378074 CREMA DE LECH 2,300"
    /(?:\d+\s+UN\s+)?(\d{1,3}(?:\.\d{3})*(?:\.\d{1,2})?)\s+[\d.]+\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ\s\/\-]+?)\s+(\d{1,3}(?:\.\d{3})*(?:\.\d{1,2})?)\s*[A-Z]?$/i,

    // Formato 3: "4,300 7700304509423 INFUSION FRUT 4,300 A"
    /(\d{1,3}(?:\.\d{3})*(?:\.\d{1,2})?)\s+[\d.]+\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ\s\/\-]+?)\s+(\d{1,3}(?:\.\d{3})*(?:\.\d{1,2})?)\s*[A-Z]?$/i
  ];

  for (const line of lines) {
    if (!line.trim() || line.includes('TOTAL') || line.includes('CODIGO') ||
      line.includes('DESCRIPCION') || line.includes('VALOR U')) {
      continue;
    }

    for (const pattern of regexPatterns) {
      const match = line.match(pattern);
      if (match) {
        let description, priceStr;

        if (match.length === 2) {
          // Solo precio (no debería ocurrir)
          continue;
        } else if (match.length === 3) {
          // Formato con descripción y precio
          description = match[1].trim();
          priceStr = match[2];
        } else {
          // Formatos con precio, código, descripción y precio final
          description = match[2].trim();
          priceStr = match[3] || match[1]; // Tomar el último precio o el primero
        }

        const price = parseFloat(priceStr.replace(/[:\.]/g, ''));

        if (!isNaN(price) && description && !description.match(/^\d/)) {
          items.push({ description, price });
          break; // Si encontramos un patrón que coincide, pasamos a la siguiente línea
        }
      }
    }
  }

  return items;
};