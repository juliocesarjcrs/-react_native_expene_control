import { Product } from '~/shared/types/components/receipt-scanner.type';
import { parseCarulla } from './carulla';
import { parseD1 } from './d1';
import { parseGeneric } from './parseGeneric';
import { parseDollarCity } from './dollarCity';
import { parseAra } from './ara';
import { parseCruzVerde } from './cruzVerde';
import { isSuperCarnesJH, parseSuperCarnesJH } from './Supercarnesjh';

export function extractProducts(ocr: string): Product[] {
  const lines = ocr
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, ' ').trim())
    .filter(Boolean);

  const joined = lines.join(' ');
  const isD1 = ocr.includes('CAN ') || ocr.includes('DESCRIPCION');
  const isCarulla = ocr.includes('PLU') || ocr.includes('DETALLE');
  const isDollarCity = ocr.includes('@');
  const isAra = ocr.includes('Artículo') || ocr.includes('Articulo');
  const isCruzVerde = ocr.includes('TARIFA') && ocr.includes('IVA');
  const isSuperCarnes = isSuperCarnesJH(ocr);

  console.log('🧾 OCR:', joined.slice(0, 300));
  if (isSuperCarnes) {
    console.log('🥩 isSuperCarnesJH:', isSuperCarnes);
    return parseSuperCarnesJH(lines, joined);
  } else if (isCruzVerde) {
    console.log('🔍 isCruzVerde:', isCruzVerde);
    return parseCruzVerde(lines);
  } else if (isCarulla) {
    console.log('🔍 isCarulla:', isCarulla);
    return parseCarulla(lines, joined);
  } else if (isD1) {
    console.log('🔍 isD1:', isD1);
    return parseD1(lines, joined);
  } else if (isDollarCity) {
    console.log('🔍 isDollarCity:', isDollarCity);
    return parseDollarCity(lines);
  } else if (isAra) {
    console.log('🔍 isAra:', isAra);
    return parseAra(lines);
  } else {
    return parseGeneric(lines, joined);
  }
}
