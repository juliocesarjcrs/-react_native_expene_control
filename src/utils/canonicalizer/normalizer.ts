import { STOP_WORDS } from './stopWords';

// ─── LIMPIEZA DE RUIDO OCR ───────────────────────────────────────────────────

/**
 * Patrones que el OCR incrusta DENTRO del nombre del producto.
 * Son sufijos/infijos que no forman parte del nombre real.
 *
 * Orden: de más específico a más general para no dejar residuos.
 * Ej: "a granel" antes que una letra suelta, para no cortar "granel" a medias.
 *
 * Fuentes observadas en los datos:
 *   - Calidad/categoría:  "CA", "AA", "AAA", "AG", "A G"
 *   - Presentación:       "A Granel", "A Gran", "Xkg", "Malla", "Bandeja"
 *   - Texto truncado:     "Fracci", "Hidrop", "Instanta", "Br", "Ahum"
 *   - Letra suelta final: "M", "S", "G", "R", "D", "B", "X" (marca/talla OCR)
 */
const OCR_NOISE_PATTERNS: RegExp[] = [
  // Presentación
  /\b(al?\s*gran(el)?|a\s*gra(nel)?|xkg|x\s*kg|por\s*kg)\b/gi,
  /\b(mal(la)?|pqt)\b/gi,

  // Calidades de supermercado colombiano
  /\b(aaa|aa|ag)\b/gi,

  // Palabras truncadas frecuentes en tickets de 40 col.
  /\b(fracci(onada?)?|hidrop(onica?)?|instanta(neo?)?|instan\/l?)\b/gi,
  /\b(ahum(ada?)?|desl(actosada?)?|descr(ipcion)?)\b/gi,
  /\b(br(ioche)?|brio(che)?|semi?d(esl?)?)\b/gi,

  // Letra sola al final (marca, talla, código OCR)
  // Solo cuando es la última "palabra" del fragmento
  /\s+[a-z]$/i
];

/**
 * Elimina el ruido OCR específico del NOMBRE del producto.
 * Solo actúa sobre el fragmento de nombre (ya sin tienda, precio ni dashes).
 *
 * A diferencia de baseNormalize (que es destructiva e irreversible),
 * stripOcrNoise conserva mayúsculas y acentos: el resultado aún puede
 * pasarse a toTitleCase o baseNormalize después.
 *
 * @example
 *   stripOcrNoise('Tomate Chonto CA')     → 'Tomate Chonto'
 *   stripOcrNoise('Pechuga Blanca M')     → 'Pechuga Blanca'
 *   stripOcrNoise('Panela Fracci')        → 'Panela'
 *   stripOcrNoise('Lechuga Hidrop')       → 'Lechuga'  (isTruncationOf lo resuelve)
 *   stripOcrNoise('Zanahoria A Gran')     → 'Zanahoria'
 *   stripOcrNoise('Limon Tahiti AG')      → 'Limon Tahiti'
 */
export function stripOcrNoise(namePart: string): string {
  let s = namePart;
  for (const pattern of OCR_NOISE_PATTERNS) {
    s = s.replace(pattern, ' ');
  }
  return s.replace(/\s{2,}/g, ' ').trim();
}

// ─── NORMALIZACIÓN BASE ──────────────────────────────────────────────────────

/**
 * Normalización base: elimina acentos, plurales simples, capitalización,
 * y caracteres OCR espurios. No hace matching semántico.
 */
export function baseNormalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s]/g, ' ') // quitar paréntesis, asteriscos, etc.
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Extrae solo los tokens semánticos (sin stop words ni tokens de 1 char).
 * Usado para comparar productos truncados.
 */
export function semanticTokens(text: string): string[] {
  return baseNormalize(text)
    .split(' ')
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Capitaliza cada palabra para almacenamiento canónico.
 */
export function toTitleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
