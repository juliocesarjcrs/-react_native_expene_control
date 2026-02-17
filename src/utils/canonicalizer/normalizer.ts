import { STOP_WORDS } from './stopWords';

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
