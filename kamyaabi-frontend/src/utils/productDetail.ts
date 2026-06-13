export function parseDescriptionBullets(raw: string): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  const explicit = trimmed
    .split(/\r?\n|(?:^|\s)[-•*]\s+/gm)
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter((s) => s.length > 2);
  if (explicit.length > 1) return explicit;
  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=[A-Z("'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return sentences.length > 0 ? sentences : [trimmed];
}

export function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Date.now() - then;
  const day = 86_400_000;
  if (diff < day) return 'today';
  if (diff < day * 2) return 'yesterday';
  if (diff < day * 30) return `${Math.floor(diff / day)} days ago`;
  if (diff < day * 365) return `${Math.floor(diff / (day * 30))} months ago`;
  return `${Math.floor(diff / (day * 365))} years ago`;
}

export function parseWeightInGrams(weight: string | undefined, unit: string | undefined): number | null {
  if (!weight) return null;
  const num = parseFloat(String(weight).replace(/[^\d.]/g, ''));
  if (!isFinite(num) || num <= 0) return null;
  const u = (unit || '').toLowerCase().trim();
  if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(u)) return num * 1000;
  if (['g', 'gm', 'gms', 'gram', 'grams'].includes(u) || u === '') return num;
  return null;
}
