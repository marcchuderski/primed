const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

/** German integer formatting with a real minus sign: 1.092, −210. */
export function formatInt(value: number): string {
  const text = integer.format(Math.round(value));
  return text.replace('-', '−');
}

/** Up to one decimal (0,5 g); integers stay integers. */
export function formatDecimal(value: number): string {
  return oneDecimal.format(value).replace('-', '−');
}

/**
 * Remaining time in words, rounded to half hours (BRIEFING §4a):
 * < 30 min → "gleich", then "30 Minuten", "1 Stunde", "1½ Stunden", "2 Stunden" …
 */
export function formatRemaining(minutes: number): string {
  if (minutes < 30) {
    return 'gleich';
  }
  const halves = Math.round(minutes / 30);
  if (halves <= 1) {
    return '30 Minuten';
  }
  const hours = Math.floor(halves / 2);
  const half = halves % 2 === 1 ? '½' : '';
  if (hours === 1 && half === '') {
    return '1 Stunde';
  }
  return `${String(hours)}${half} Stunden`;
}
