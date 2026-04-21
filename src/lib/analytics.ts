import { startOfWeek, endOfWeek, isWithinInterval, subMonths, isSameDay, addDays, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export type HeatmapCell = {
  date: string; // yyyy-MM-dd
  status: 'completed' | 'skipped' | 'missed' | 'none';
};

export function weeklyCompletionRate(
  logs: { date: Date; status: string }[],
  userTimezone: string
): number {
  const now = toZonedTime(new Date(), userTimezone);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeekLogs = logs.filter(l =>
    isWithinInterval(toZonedTime(l.date, userTimezone), { start: weekStart, end: weekEnd })
  );

  if (thisWeekLogs.length === 0) return 0;

  const completed = thisWeekLogs.filter(l => l.status === 'completed').length;
  return Math.round((completed / thisWeekLogs.length) * 100);
}

export function buildHeatmapData(
  logs: { date: Date; status: string }[],
  userTimezone: string,
  months: number = 3
): HeatmapCell[] {
  const now = toZonedTime(new Date(), userTimezone);
  const start = subMonths(now, months);
  const cells: HeatmapCell[] = [];

  let cursor = start;
  while (cursor <= now) {
    const log = logs.find(l =>
      isSameDay(toZonedTime(l.date, userTimezone), cursor)
    );

    cells.push({
      date: format(cursor, 'yyyy-MM-dd'),
      status: (log?.status as HeatmapCell['status']) ?? 'none',
    });

    cursor = addDays(cursor, 1);
  }

  return cells;
}

export function weekOverWeekTrend(
  logs: { date: Date; status: string }[],
  userTimezone: string
): { thisWeek: number; lastWeek: number; delta: number } {
  const thisWeek = weeklyCompletionRate(logs, userTimezone);

  // Shift logs back 7 days for last week calculation
  const lastWeekLogs = logs.map(l => ({
    ...l,
    date: addDays(l.date, 7), // shift to current week range
  }));
  const lastWeek = weeklyCompletionRate(lastWeekLogs, userTimezone);

  return {
    thisWeek,
    lastWeek,
    delta: thisWeek - lastWeek, // positive = improving
  };
}
