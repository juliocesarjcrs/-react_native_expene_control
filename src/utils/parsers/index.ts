import { Product } from "~/shared/types/components/receipt-scanner.type";
import { parseCarulla } from "./carulla";
import { parseD1 } from "./d1";
import { parseGeneric } from "./parseGeneric";

export function extractProducts(ocr: string): Product[] {
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


  if (isCarulla) {
    return parseCarulla(lines, joined);
  }
  if (isD1) {
    return parseD1(lines, joined);

  }
  return parseGeneric(lines, joined);
}