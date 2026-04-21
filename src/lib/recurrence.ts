import { getDay, getDate, differenceInDays, parseISO, addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export type RecurrenceRule = 
  | { type: 'once' }
  | { type: 'daily' }
  | { type: 'weekdays' }                          // Mon–Fri
  | { type: 'selected_days'; days: number[] }     // 0=Sun, 1=Mon ... 6=Sat
  | { type: 'weekly'; day: number }               // 0–6
  | { type: 'monthly'; day: number }              // 1–31
  | { type: 'custom'; every: number; unit: 'day' | 'week' | 'month'; start_date: string };

export function isDueToday(
  rule: RecurrenceRule | null,
  userTimezone: string,
  targetDate: Date = new Date()
): boolean {
  if (!rule) return false;
  
  const now = toZonedTime(targetDate, userTimezone);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (rule.type) {
    case 'once':
      return false; // handled separately via due_date field

    case 'daily':
      return true;

    case 'weekdays': {
      const day = getDay(today);
      return day >= 1 && day <= 5;
    }

    case 'selected_days':
      return rule.days.includes(getDay(today));

    case 'weekly':
      return getDay(today) === rule.day;

    case 'monthly':
      return getDate(today) === rule.day;

    case 'custom': {
      const start = parseISO(rule.start_date);
      const startZoned = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const diff = differenceInDays(today, startZoned);
      const interval = rule.unit === 'day' ? 1
        : rule.unit === 'week' ? 7
        : 30; // approximate for months
      return diff >= 0 && diff % (rule.every * interval) === 0;
    }

    default:
      return false;
  }
}

export function calculateStreak(
  logs: { date: Date; status: string }[],
  userTimezone: string
): { current: number; longest: number; lastCompletedDate: Date | null } {
  const completedDates = logs
    .filter(l => l.status === 'completed')
    .map(l => {
        const zoned = toZonedTime(l.date, userTimezone);
        return new Date(Date.UTC(zoned.getFullYear(), zoned.getMonth(), zoned.getDate()));
    })
    .sort((a, b) => b.getTime() - a.getTime()); // newest first

  if (completedDates.length === 0) return { current: 0, longest: 0, lastCompletedDate: null };

  let current = 1;
  let longest = 1;
  let streak = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const diff = differenceInDays(completedDates[i - 1], completedDates[i]);
    if (diff === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else if (diff > 1) { // skipped a day
      streak = 1;
    }
  }

  // Check if streak is still active (last completion was today or yesterday)
  const now = toZonedTime(new Date(), userTimezone);
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  
  const daysSinceLast = differenceInDays(today, completedDates[0]);
  current = daysSinceLast <= 1 ? streak : 0;

  return { current, longest, lastCompletedDate: completedDates[0] };
}

export function getNextDueDates(
  rule: RecurrenceRule,
  userTimezone: string,
  count: number = 7
): Date[] {
  const dates: Date[] = [];
  const now = toZonedTime(new Date(), userTimezone);
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  while (dates.length < count) {
    cursor = addDays(cursor, 1);
    if (isDueToday(rule, userTimezone, cursor)) {
      dates.push(new Date(cursor));
    }
    if (dates.length === 0 && differenceInDays(cursor, now) > 365) break; // safety
  }

  return dates;
}
