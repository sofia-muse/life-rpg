import { QuestCompletionLogEntry } from '../types';
import { daysBetween } from './calendar';

export type { QuestCompletionLogEntry };

/** Enough history for the current week, including a zone shift around Monday. */
const KEEP_DAYS = 21;

/** Append one full completion. The same quest on the same calendar day is stored once. */
export function appendCompletionLog(
  log: QuestCompletionLogEntry[] | undefined,
  entry: QuestCompletionLogEntry,
): QuestCompletionLogEntry[] {
  const next = [...(log ?? [])];
  const exists = next.some((item) => item.questId === entry.questId && item.date === entry.date);
  if (!exists) next.push(entry);
  const newest = next.reduce((max, item) => (item.date > max ? item.date : max), entry.date);
  return next.filter((item) => {
    const age = daysBetween(item.date, newest);
    return age !== null && age >= 0 && age <= KEEP_DAYS;
  });
}

/** Keep the local log and fold in server rows. An empty incoming list leaves the local log alone. */
export function mergeCompletionLogs(
  current: QuestCompletionLogEntry[] | undefined,
  incoming: QuestCompletionLogEntry[] | undefined,
): QuestCompletionLogEntry[] {
  if (!incoming?.length) return current ?? [];
  return incoming.reduce((log, entry) => appendCompletionLog(log, entry), current ?? []);
}
