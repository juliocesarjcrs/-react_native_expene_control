/* eslint-disable no-useless-escape */
import { Product } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';

export function parseAra(lines: string[]): Product[] {
  console.log('📄 Procesando como tipo Ara...');

  const products: Product[] = [];

  // Regex que maneja ambos formatos:
  // 1. Formato con número inicial: "1 7704269114289 FUSILLI ARRI 3. 990 D"
  // 2. Formato sin número: "07704269659070 CEPIL DENTAL 4.490 G"
  const productLineRegex = /^(?:(\d+)\s+)?(\d{13,14})\s+([^\t\r\n]+?)\s+([\d\s\.]+)\s*([A-Z])?$/;

  for (const line of lines) {
    const match = line.match(productLineRegex);
    if (match) {
      const rawDescription = match[3].trim();
      let rawPrice = match[4].replace(/\s/g, '');

      // Manejar casos donde el precio podría tener formato "3. 840" -> "3840"
      if (rawPrice.includes('.')) {
        rawPrice = rawPrice.replace('.', '');
      }

      const description = formatDescription(rawDescription.replace(/\./g, ''));
      const price = parseInt(rawPrice);

      if (!isNaN(price) && price > 0) {
        products.push({ description, price });
      }
    }
  }

  return products;
}
