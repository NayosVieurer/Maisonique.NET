// Calendar days are civil dates. UTC is used only for arithmetic, so a DST change never skips a day.

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function displayDay(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(
    new Date(iso + 'T12:00:00Z'),
  );
}

export function weekLabel(start: string): string {
  const end = addDays(start, 6);
  const left = displayDay(start, {
    day: 'numeric',
    month: start.slice(0, 7) === end.slice(0, 7) ? undefined : 'short',
  });

  return (
    left + ' – ' + displayDay(end, { day: 'numeric', month: 'short', year: 'numeric' })
  );
}
