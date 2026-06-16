import { Product } from '~/shared/types/components/receipt-scanner.type';
import { parseCarulla } from './carulla';
import { parseD1 } from './d1';
import { parseGeneric } from './parseGeneric';
import { parseDollarCity } from './dollarCity';
import { parseAra } from './ara';
import { parseCruzVerde } from './cruzVerde';
import { isSuperCarnesJH, parseSuperCarnesJH } from './superCarnesJH';
import { isFruverLaGranja, parseFruverLaGranja } from './fruverLaGranja';

export function extractProducts(ocr: string, storeHint?: 'Carulla' | 'Exito'): Product[] {
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
  const isFruver = isFruverLaGranja(ocr);

  if (isFruver) {
    return parseFruverLaGranja(lines, joined);
  } else if (isSuperCarnes) {
    return parseSuperCarnesJH(lines, joined);
  } else if (isCruzVerde) {
    return parseCruzVerde(lines);
  } else if (isCarulla) {
    return parseCarulla(lines, joined, [], storeHint);
  } else if (isD1) {
    return parseD1(lines, joined);
  } else if (isDollarCity) {
    return parseDollarCity(lines);
  } else if (isAra) {
    return parseAra(lines);
  } else {
    return parseGeneric(lines, joined);
  }
}
