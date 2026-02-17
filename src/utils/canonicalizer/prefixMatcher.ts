import { semanticTokens } from './normalizer';

/**
 * Determina si dos nombres de producto son probablemente el mismo,
 * considerando truncamiento OCR.
 *
 * Ejemplos que deben matchear:
 *   "Tomate Chonto (A"  ↔  "Tomate Chonto"       ✓ (A es truncamiento)
 *   "Habichuela A Gra"  ↔  "Habichuela A Granel"  ✓
 *
 * Ejemplos que NO deben matchear:
 *   "Lagarto"           ↔  "Lagarto Molida"        ✗ (son cortes distintos)
 *   "Pepino Cohombro"   ↔  "Pepino Calabacin"      ✗ (son verduras distintas)
 */
export function isTruncationOf(candidate: string, existing: string): boolean {
  const tokensA = semanticTokens(candidate);
  const tokensB = semanticTokens(existing);

  const shorter = tokensA.length <= tokensB.length ? tokensA : tokensB;
  const longer = tokensA.length <= tokensB.length ? tokensB : tokensA;

  // Necesitamos al menos 2 tokens para evitar falsos positivos ("Papa" ≠ "Papa Sin Lavar")
  if (shorter.length < 2) return false;

  // El más corto debe ser prefijo del más largo (en orden)
  // Esto evita que "Pepino Res" matchee con "Pepino Calabacin"
  // porque "res" no está en "calabacin"
  return shorter.every((token, i) => longer[i] === token);
}
