import { Product } from "~/shared/types/components/receipt-scanner.type";
import { parseCarulla } from "./carulla";
import { parseD1 } from "./d1";
import { parseGeneric } from "./parseGeneric";
import { parseDollarCity } from "./dollarCity";

export function extractProducts(ocr: string): Product[] {
  const lines = ocr
    .split(/\r?\n/)
    .map(l => l.replace(/\t/g, ' ').trim())
    .filter(Boolean);

  const joined = lines.join(' ');
  const isD1 = ocr.includes('CAN ') || ocr.includes('DESCRIPCION');
  const isCarulla = ocr.includes('PLU') || ocr.includes('DETALLE');
  const isDollarCity = ocr.includes('@');

  console.log("🧾 OCR:", joined.slice(0, 300));

  if (isCarulla) {
    console.log("🔍 isCarulla:", isCarulla);
    return parseCarulla(lines, joined);
  } else if (isD1) {
    console.log("🔍 isD1:", isD1);
    return parseD1(lines, joined);
  } else if (isDollarCity) {
    console.log("🔍 isDollarCity:", isDollarCity);
    return parseDollarCity(lines);
  } else {
    return parseGeneric(lines, joined);
  }
}