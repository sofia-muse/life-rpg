/** Calendar dates in the hero's timezone. Day boundaries follow local midnight, not UTC. */

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function calendarToday(timeZone?: string | null, now: Date = new Date()): string {
  return calendarDateInZone(now, timeZone);
}

/** YYYY-MM-DD for an instant in the given IANA zone. Invalid zones fall back to UTC. */
export function calendarDateInZone(instant: Date, timeZone?: string | null): string {
  const tz = timeZone && timeZone.trim() ? timeZone.trim() : 'UTC';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(instant);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Invalid time zone id — fall through to UTC.
  }
  return instant.toISOString().slice(0, 10);
}

/** Monday-start week key for a calendar date in the given zone. */
export function calendarWeekKey(timeZone?: string | null, now: Date = new Date()): string {
  const today = calendarToday(timeZone, now);
  const [year, month, day] = today.split('-').map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  const diff = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  return utc.toISOString().slice(0, 10);
}

export function calendarDayNumber(isoDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.floor(utc / 86_400_000);
}

/** later - earlier in calendar days. Null when either date is not YYYY-MM-DD. */
export function daysBetween(earlier: string, later: string): number | null {
  const start = calendarDayNumber(earlier);
  const end = calendarDayNumber(later);
  if (start === null || end === null) return null;
  return end - start;
}
