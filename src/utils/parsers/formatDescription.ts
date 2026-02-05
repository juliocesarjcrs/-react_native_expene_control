export function formatDescription(desc: string): string {
  return desc
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/\.$/, '') // Remover punto final
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
