---
name: analytics-streak-calculation
description: Use when building the Analytics page, Insights page, streak displays, heatmaps, completion rate calculations, trend comparisons, or any data aggregation from habit_logs or tasks.
---

# Analytics & Streak Calculation

## Use this skill when
- Building the Analytics / Insights page (Phase 2)
- Displaying streak counts anywhere in the app
- Building calendar heatmaps
- Calculating completion rates (weekly / monthly)
- Building trend comparison (this week vs last week)
- Aggregating any data from habit_logs

---

## Critical Rule — Streaks Are Never Stored Raw

**Streak is ALWAYS calculated from `habit_logs`. Never store or increment a streak counter directly.**

Why: If a user completes a habit, then the admin deletes a log entry, or a bug occurs — a stored counter becomes wrong forever. Calculated streaks self-correct on every load.

The `streak_summaries` table is a **cache** — it is updated after every habit log action, not the source of truth.

---

## Streak Calculation

See `recurrence-logic` skill for the `calculateStreak()` function. Always use it.

When to update `streak_summaries`:
- After every `POST /api/habits/[id]/log` (complete or skip)
- After any `habit_logs` deletion
- Never increment manually

```ts
// After logging a habit action, recalculate and cache
async function updateStreakCache(habitId: string, userTimezone: string) {
  const logs = await prisma.habitLog.findMany({
    where: { habit_id: habitId },
    select: { date: true, status: true },
    orderBy: { date: 'desc' },
  });

  const { current, longest } = calculateStreak(logs, userTimezone);

  await prisma.streakSummary.upsert({
    where: { habit_id: habitId },
    update: {
      current_streak: current,
      longest_streak: longest,
      last_completed_date: logs.find(l => l.status === 'completed')?.date ?? null,
      updated_at: new Date(),
    },
    create: {
      habit_id: habitId,
      current_streak: current,
      longest_streak: longest,
      last_completed_date: logs.find(l => l.status === 'completed')?.date ?? null,
    },
  });
}
```

---

## Completion Rate Calculation

### Weekly Completion Rate (per habit)

```ts
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
```

### Monthly Completion Rate

Same pattern, use `startOfMonth` / `endOfMonth` from `date-fns`.

---

## Calendar Heatmap Data

GitHub-style heatmap — one cell per day, colored by completion status.

```ts
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
      status: log?.status ?? 'none', // completed | skipped | missed | none
    });

    cursor = addDays(cursor, 1);
  }

  return cells;
}
```

Color mapping for heatmap cells:
- `completed` → green (e.g. `#22c55e`)
- `skipped` → yellow (e.g. `#eab308`)
- `missed` → red/light (e.g. `#fca5a5`)
- `none` → gray (e.g. `#f3f4f6`)

---

## Trend Comparison — This Week vs Last Week

```ts
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
```

---

## Analytics Snapshots (Phase 2)

Store weekly/monthly snapshots in `analytics_snapshots` to avoid recalculating on every load:

```ts
// Snapshot data shape
type SnapshotData = {
  habits: {
    id: string;
    title: string;
    current_streak: number;
    longest_streak: number;
    completion_rate: number;
    heatmap: HeatmapCell[];
  }[];
  overall_completion_rate: number;
  week_over_week_delta: number;
};
```

Regenerate snapshots:
- Weekly snapshots: every Sunday at midnight (Vercel Cron)
- Monthly snapshots: first day of each month

---

## Recharts — Use These Chart Types

- **Streak trend:** `LineChart` with `Line` component
- **Completion rate:** `BarChart` with weekly bars
- **Heatmap:** Custom SVG grid (Recharts doesn't have heatmap — build manually or use `react-calendar-heatmap`)
- **Consistency ranking:** `BarChart` horizontal, habits sorted by completion rate
