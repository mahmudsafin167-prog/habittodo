---
name: recurrence-logic
description: Use when implementing or calculating recurring tasks, recurring habits, repeat rules, due date generation, or checking if a task/habit is due on a specific date.
---

# Recurrence Logic

## Use this skill when
- Implementing recurrence_rule for tasks or habits
- Calculating if a task/habit is due today
- Generating next due dates
- Rendering recurring items in Today / Upcoming views
- Writing any function that involves repeat schedules

---

## Recurrence Rule Schema (stored as JSON)

```ts
type RecurrenceRule = 
  | { type: 'once' }
  | { type: 'daily' }
  | { type: 'weekdays' }                          // Mon–Fri
  | { type: 'selected_days'; days: number[] }     // 0=Sun, 1=Mon ... 6=Sat
  | { type: 'weekly'; day: number }               // 0–6
  | { type: 'monthly'; day: number }              // 1–31
  | { type: 'custom'; every: number; unit: 'day' | 'week' | 'month'; start_date: string } // ISO date
```

---

## Core Function — Is Due Today?

```ts
import { isWithinInterval, isSameDay, getDay, getDate, differenceInDays, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function isDueToday(
  rule: RecurrenceRule,
  userTimezone: string,
  taskCreatedAt: Date
): boolean {
  const now = toZonedTime(new Date(), userTimezone);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (rule.type) {
    case 'once':
      return false; // handled separately via due_date field

    case 'daily':
      return true;

    case 'weekdays': {
      const day = getDay(today); // 0=Sun, 6=Sat
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
      const diff = differenceInDays(today, start);
      const interval = rule.unit === 'day' ? 1
        : rule.unit === 'week' ? 7
        : 30; // approximate for months
      return diff >= 0 && diff % (rule.every * interval) === 0;
    }

    default:
      return false;
  }
}
```

---

## Streak Calculation — Always From habit_logs

**Never store streak as a raw counter.** Always calculate from `habit_logs`.

```ts
export function calculateStreak(
  logs: { date: Date; status: string }[],
  rule: RecurrenceRule,
  userTimezone: string
): { current: number; longest: number } {
  const completedDates = logs
    .filter(l => l.status === 'completed')
    .map(l => toZonedTime(l.date, userTimezone))
    .sort((a, b) => b.getTime() - a.getTime()); // newest first

  if (completedDates.length === 0) return { current: 0, longest: 0 };

  let current = 1;
  let longest = 1;
  let streak = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const diff = differenceInDays(completedDates[i - 1], completedDates[i]);
    if (diff === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }

  // Check if streak is still active (last completion was today or yesterday)
  const now = toZonedTime(new Date(), userTimezone);
  const daysSinceLast = differenceInDays(now, completedDates[0]);
  current = daysSinceLast <= 1 ? streak : 0;

  return { current, longest };
}
```

---

## Generating "Upcoming" Dates

For the Upcoming view, generate the next N due dates for a recurring task:

```ts
export function getNextDueDates(
  rule: RecurrenceRule,
  userTimezone: string,
  count: number = 7
): Date[] {
  const dates: Date[] = [];
  const now = toZonedTime(new Date(), userTimezone);
  let cursor = new Date(now);

  while (dates.length < count) {
    cursor = addDays(cursor, 1);
    if (isDueToday(rule, userTimezone, cursor)) {
      dates.push(new Date(cursor));
    }
    if (dates.length === 0 && differenceInDays(cursor, now) > 365) break; // safety
  }

  return dates;
}
```

---

## Important Rules

- Always use `date-fns-tz` and the user's timezone when comparing dates — never use raw `new Date()` without timezone conversion
- For `monthly` recurrence with day > 28, handle months that don't have that day gracefully (skip to next valid month)
- Streak counts only `completed` logs — `skipped` and `missed` break the streak
- On habit creation, do NOT create any `habit_logs` entries — logs are only created when the user takes action
