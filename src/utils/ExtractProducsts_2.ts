import { Product } from "~/shared/types/components/receipt-scanner.type";

// Configuración optimizada para cada tienda
const STORE_CONFIGS = {
  D1: {
    identifiers: ['CAN', 'DESCRIPCION', 'D1', 'TIENDA D1', 'VALOR U'],
    productPatterns: [
      // Formato: Precio Código Descripción
      /(\d{1,3}(?:[.,]\d{3}))\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ/\- ]{3,})/gi,
      // Formato: Descripción Precio
      /([A-ZÁÉÍÓÚÑ/\- ]{3,})\s+(\d{1,3}(?:[.,]\d{3}))/gi
    ],
    exclusionPattern: /TOTAL|SUBTOTAL|DESCUENTO|VALOR TOTAL|OTRO|\d+\s*ITEM/i
  },
  Carulla: {
    identifiers: ['PLU', 'DETALLE', 'CARULLA', 'AHORRO'],
    productPatterns: [
      // Formato: PLU Descripción Precio
      /(\d{6,})\s+([^\d]+?)\s+(\d{1,3}(?:[.,]\d{3}))/i,
      // Formato con precio en línea siguiente
      /^(\d{6,})\s+([^\d]+)$/i,
      // Formato con descripción en línea anterior
      /^(\d{1,3}(?:[.,]\d{3}))$/i,
      // Formato especial para productos pesables
      /(\d+)\s+([A-Za-zÁÉÍÓÚÜÑñ().,/\- ]{3,})\s+(\d{1,3}(?:[.,]\d{3}))/i
    ],
    exclusionPattern: /V\.?\s*Ahorro|Total Item|SUBTOTAL|DESCUENTO|VALOR TOTAL|\d+\s*ITEM/i,
    priceLinePattern: /^(\d{1,3}(?:[.,]\d{3}))/,
    descriptionCleanup: /(\d{6,}\s+)|(V\.?\s*Ahorro\s+\d+)/gi
  }
};

export function extractProducts(ocr: string): Product[] {
  const products: Product[] = [];
  const lines = ocr.split(/\r?\n/)
    .map(l => l.replace(/\t/g, ' ').trim())
    .filter(Boolean);

  const store = detectStore(ocr);
  console.log("🔍 Detected store:", store);

  if (store === 'D1') {
    processD1Receipt(lines, products);
  } else if (store === 'Carulla') {
    processCarullaReceipt(lines, products);
  } else {
    processGenericReceipt(lines, products);
  }

  console.log(`✅ Total productos detectados: ${products.length}`);
  return products;
}

// Funciones auxiliares mejoradas
function detectStore(ocr: string): string | null {
  const upperOcr = ocr.toUpperCase();
  for (const [store, config] of Object.entries(STORE_CONFIGS)) {
    if (config.identifiers.some(id => upperOcr.includes(id))) {
      return store;
    }
  }
  return null;
}

function processD1Receipt(lines: string[], products: Product[]) {
  console.log("📄 Procesando como tipo D1...");
  const config = STORE_CONFIGS.D1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (config.exclusionPattern.test(line)) continue;

    for (const pattern of config.productPatterns) {
      const match = line.match(pattern);
      if (match) {
        let description, priceRaw;
        
        if (pattern === config.productPatterns[0]) {
          // Formato: Precio Código Descripción
          priceRaw = match[1];
          description = match[3];
        } else {
          // Formato: Descripción Precio
          description = match[1];
          priceRaw = match[2];
        }

        if (description && priceRaw) {
          const cleanDesc = cleanDescription(description);
          const price = parsePrice(priceRaw);
          addUniqueProduct(products, cleanDesc, price);
        }
        break;
      }
    }
  }
}

function processCarullaReceipt(lines: string[], products: Product[]) {
  console.log("📄 Procesando como tipo Carulla...");
  const config = STORE_CONFIGS.Carulla;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (config.exclusionPattern.test(line)) continue;

    // Patrón 1: PLU Descripción Precio
    const productMatch = line.match(config.productPatterns[0]);
    if (productMatch) {
      const description = cleanDescription(productMatch[2]);
      const price = parsePrice(productMatch[3]);
      addUniqueProduct(products, description, price);
      continue;
    }

    // Patrón 2: PLU Descripción (precio en línea siguiente)
    const descMatch = line.match(config.productPatterns[1]);
    if (descMatch && i < lines.length - 1) {
      const nextLine = lines[i + 1];
      const priceMatch = nextLine.match(config.priceLinePattern);
      if (priceMatch) {
        const description = cleanDescription(descMatch[2]);
        const price = parsePrice(priceMatch[1]);
        addUniqueProduct(products, description, price);
        i++; // Saltar la línea del precio
        continue;
      }
    }

    // Patrón 3: Precio solo (descripción en línea anterior)
    const priceMatch = line.match(config.productPatterns[2]);
    if (priceMatch && i > 0) {
      const prevLine = lines[i - 1];
      const descMatch = prevLine.match(/(\d{6,})\s+(.+)/);
      if (descMatch) {
        const description = cleanDescription(descMatch[2]);
        const price = parsePrice(priceMatch[1]);
        addUniqueProduct(products, description, price);
        continue;
      }
    }

    // Patrón 4: Productos pesables
    const weightedMatch = line.match(config.productPatterns[3]);
    if (weightedMatch) {
      const description = cleanDescription(weightedMatch[2]);
      const price = parsePrice(weightedMatch[3]);
      addUniqueProduct(products, description, price);
      continue;
    }
  }
}

function processGenericReceipt(lines: string[], products: Product[]) {
  console.log("🧠 Procesando con heurística genérica...");
  const genericPatterns = [
    /([A-ZÁÉÍÓÚÑ ].+?)\s+(\d{1,3}(?:[.,]\d{3}))/i,
    /(\d{1,3}(?:[.,]\d{3}))\s+([A-ZÁÉÍÓÚÑ ].+)/i
  ];

  for (const line of lines) {
    for (const pattern of genericPatterns) {
      const match = line.match(pattern);
      if (match) {
        const description = cleanDescription(match[1] || match[2]);
        const price = parsePrice(match[1]?.match(/(\d{1,3}(?:[.,]\d{3}))/)?.[0] || match[2]);
        addUniqueProduct(products, description, price);
        break;
      }
    }
  }
}

function cleanDescription(description: string): string {
  return description
    .replace(/\d{6,}/g, '') // Elimina códigos PLU
    .replace(/V\.?\s*Ahorro\s+\d+/gi, '') // Elimina texto de ahorro
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parsePrice(priceRaw: string): number {
  return parseInt(priceRaw.replace(/[.,\s]/g, ''), 10);
}

function addUniqueProduct(products: Product[], description: string, price: number) {
  if (!description || isNaN(price)) return;

  // Validaciones adicionales
  const cleanDesc = description.trim();
  if (cleanDesc.length >= 3 && price > 0 && price < 1000000) {
    const existing = products.find(p => 
      p.description === cleanDesc && p.price === price
    );
    if (!existing) {
      products.push({ description: cleanDesc, price });
    }
  }
}