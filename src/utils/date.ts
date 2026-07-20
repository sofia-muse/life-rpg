/** Calendar date as YYYY-MM-DD in local ISO form (UTC date portion of toISOString). */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}
