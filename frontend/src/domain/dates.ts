/** "2026-10-20" → "20.10.2026" (no time zone involved). */
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day ?? ''}.${month ?? ''}.${year ?? ''}`;
}
