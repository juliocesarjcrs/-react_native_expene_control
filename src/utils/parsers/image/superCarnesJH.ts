import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from '../formatDescription';
import { canonicalize } from '../../canonicalizer';

const RECEIPT_TYPE: ReceiptType = 'SuperCarnesJH';

// ─── Formato A: CODIGO PRODUCTO TOTAL|IVA + línea KGS X $precio ──────────────
const PRODUCT_WITH_PRICE_PATTERN = /(\d{4})\s+(.+?)\s+(\d{1,3}(?:[.,]\d{3})+)/;
const WEIGHT_PATTERN = /([\d.,]+)\s*(KGS?|KILOS?|GRS?|GRAMOS?)\s*[Xx×]\s*\$?\s*([\d.,]+)/i;
const SIMPLE_PRODUCT_PATTERN = /(\d{4})\s+(.+)/;

// ─── Formato B: N PRODUCTO (secuencial) + línea cantidad precioKg total ───────
// Línea de ítem: número secuencial + nombre (puede dividirse en varias líneas por OCR)
const SEQUENTIAL_ITEM_PATTERN = /^(\d{1,2})\s+(.+)$/;
// Línea de datos: cantidad,precioKg,total (sin KGS/X)
const DATA_LINE_PATTERN = /^(\d+[,.]?\d*)\s+([\d.,]+)\s+([\d.,]+)$/;

// ─── Detección de formato ─────────────────────────────────────────────────────

function isFormatoB(joined: string): boolean {
  return /ART\s+kg\s+\$/i.test(joined) || /PEPE\s+ART/i.test(joined);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseColombianNumber(raw: string): number {
  return parseInt(raw.replace(/[.,]/g, ''), 10);
}

function parseDecimal(raw: string): number {
  // Formato colombiano usa coma como decimal: "1,655" → 1.655
  return parseFloat(raw.replace(',', '.'));
}

function formatKgDescription(productName: string, quantity: number, pricePerKg: number): string {
  const formattedName = formatDescription(productName);
  // Eliminar ceros finales, luego convertir punto decimal → coma (ISO 4217 / SI colombiano)
  const formattedQty = quantity
    .toFixed(3)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '')
    .replace('.', ',');
  const formattedPrice = pricePerKg.toLocaleString('es-CO');
  return `${formattedName} — ${formattedQty} kg @ $${formattedPrice}/kg [${RECEIPT_TYPE}]`;
}

// ─── Procesadores por formato ─────────────────────────────────────────────────

function processFormatoA(lines: string[]): Product[] {
  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const productMatch = line.match(PRODUCT_WITH_PRICE_PATTERN);

    if (productMatch) {
      const productName = productMatch[2].trim();
      const totalPrice = parseColombianNumber(productMatch[3]);

      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const weightMatch = nextLine.match(WEIGHT_PATTERN);

        if (weightMatch) {
          const rawQty = parseFloat(weightMatch[1].replace(',', '.'));
          const unit = weightMatch[2].toUpperCase();
          const pricePerUnit = parseColombianNumber(weightMatch[3]);

          const quantity = unit.startsWith('GR') ? rawQty / 1000 : rawQty;

          products.push({
            description: formatKgDescription(productName, quantity, pricePerUnit),
            price: totalPrice
          });

          i++;
          continue;
        }
      }

      products.push({
        description: formatDescription(productName),
        price: totalPrice
      });
      continue;
    }

    // Patrón simple: código + nombre sin precio en la misma línea
    const simpleMatch = line.match(SIMPLE_PRODUCT_PATTERN);

    if (simpleMatch && i + 1 < lines.length) {
      const productName = simpleMatch[2].trim();
      const nextLine = lines[i + 1].trim();
      const weightMatch = nextLine.match(WEIGHT_PATTERN);

      if (weightMatch) {
        const rawQty = parseFloat(weightMatch[1].replace(',', '.'));
        const unit = weightMatch[2].toUpperCase();
        const pricePerUnit = parseColombianNumber(weightMatch[3]);

        const quantity = unit.startsWith('GR') ? rawQty / 1000 : rawQty;
        const totalPrice = Math.round(quantity * pricePerUnit);

        products.push({
          description: formatKgDescription(productName, quantity, pricePerUnit),
          price: totalPrice
        });

        i++;
      }
    }
  }

  return products;
}

/**
 * Formato B:
 *   1  TILAPIA RIO CLARO         ← ítem secuencial + nombre
 *   1,655  20000  33100           ← cantidad  precioKg  total
 *
 * El nombre puede fragmentarse en dos líneas por el OCR:
 *   2 TRUCHA XKG EL  MAR         ← nombre partido en línea de ítem
 */
function processFormatoB(lines: string[]): Product[] {
  const products: Product[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    const itemMatch = line.match(SEQUENTIAL_ITEM_PATTERN);

    if (itemMatch) {
      let productName = itemMatch[2].trim();

      // Mirar si la siguiente línea es continuación del nombre o datos
      let dataLine = '';

      if (i + 1 < lines.length) {
        const candidate = lines[i + 1].trim();

        if (DATA_LINE_PATTERN.test(candidate)) {
          dataLine = candidate;
        } else if (i + 2 < lines.length && DATA_LINE_PATTERN.test(lines[i + 2].trim())) {
          // El nombre se partió en dos líneas
          productName = `${productName} ${candidate}`.trim();
          dataLine = lines[i + 2].trim();
          i++; // consumir la línea extra del nombre
        }
      }

      if (dataLine) {
        const dataMatch = dataLine.match(DATA_LINE_PATTERN)!;
        const quantity = parseDecimal(dataMatch[1]);
        const pricePerKg = parseColombianNumber(dataMatch[2]);
        const totalPrice = parseColombianNumber(dataMatch[3]);

        products.push({
          description: formatKgDescription(productName, quantity, pricePerKg),
          price: totalPrice
        });

        i += 2; // consumir línea de ítem + línea de datos
        continue;
      }
    }

    i++;
  }

  return products;
}

// ─── Limitación por total declarado ──────────────────────────────────────────

function limitProductsByTotal(products: Product[], joined: string): Product[] {
  // Soporta: "TOTAL 2)", "TOTAL UNIDADES: 2", "TOTAL ITEMS 2", etc.
  const totalMatch = joined.match(/TOTAL\s*(?:UNIDADES|ITEMS?)?\s*[:\s)]*\s*(\d+)\s*[):]?/i);

  if (totalMatch) {
    const totalProducts = parseInt(totalMatch[1], 10);
    if (totalProducts > 0 && products.length > totalProducts) {
      return products.slice(0, totalProducts);
    }
  }

  return products;
}

// ─── Entrada pública ──────────────────────────────────────────────────────────

export function parseSuperCarnesJH(
  lines: string[],
  joined: string,
  existingCanonicals: string[] = []
): Product[] {
  const raw = isFormatoB(joined) ? processFormatoB(lines) : processFormatoA(lines);

  const limited = limitProductsByTotal(raw, joined);

  return limited.map((p) => ({
    ...p,
    description: canonicalize(p.description, existingCanonicals)
  }));
}

export function isSuperCarnesJH(ocr: string): boolean {
  const indicators = [
    /super\s*carnes\s*j\.?h\.?/i,
    /TOTAL\s+KILOS/i,
    /TOTAL\s+UNIDADES/i,
    /ART\s+kg\s+\$/i,
    /\d{4}\s+.+?\s+\d{1,3}(?:[.,]\d{3})+.*?KGS?\s*[Xx×]/is
  ];

  return indicators.some((pattern) => pattern.test(ocr));
}
