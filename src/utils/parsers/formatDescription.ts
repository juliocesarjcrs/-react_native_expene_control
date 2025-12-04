export function formatDescription(desc: string): string {
  return desc
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
