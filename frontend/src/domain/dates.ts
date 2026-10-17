const weekdayDate = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

function shift(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today and the previous days for logging later (Nachtragen, BRIEFING §5); never future days (D-049). */
export function recentDays(today: string, count = 7): { value: string; label: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const value = shift(today, -i);
    const label =
      i === 0 ? 'Heute' : i === 1 ? 'Gestern' : weekdayDate.format(new Date(`${value}T12:00:00Z`));
    return { value, label };
  });
}
