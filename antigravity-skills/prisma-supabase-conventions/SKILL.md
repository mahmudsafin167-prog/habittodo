---
name: prisma-supabase-conventions
description: Use when writing Prisma schema, running migrations, writing database queries, creating or editing any model in the data layer, or connecting to Supabase PostgreSQL.
---

# Prisma + Supabase Conventions

## Use this skill when
- Writing or editing `schema.prisma`
- Running migrations
- Writing any database query (create, read, update, delete)
- Adding new tables or columns
- Seeding the database

## Do NOT use this skill when
- Working on pure UI components
- Firebase Auth logic

---

## Stack

- **Database:** PostgreSQL via Supabase Free Tier
- **ORM:** Prisma
- **Connection:** Use `DATABASE_URL` from Supabase → Settings → Database → Connection string (use the **pooling** URL for Vercel deployments)

---

## Prisma Client — Singleton Pattern

Always use a singleton to avoid exhausting connections on Vercel:

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

Always import from `@/lib/prisma` — never instantiate `new PrismaClient()` directly in a route.

---

## Full Data Model

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String        @id  // Firebase UID
  email        String        @unique
  display_name String?
  avatar_url   String?
  timezone     String        @default("UTC")
  created_at   DateTime      @default(now())
  settings     UserSettings?
  tasks        Task[]
  habits       Habit[]
  habit_logs   HabitLog[]
  categories   Category[]
  reminders    Reminder[]
  push_subs    PushSubscription[]
  snapshots    AnalyticsSnapshot[]
}

model UserSettings {
  id                   String   @id @default(cuid())
  user_id              String   @unique
  user                 User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  theme                String   @default("light")
  notification_enabled Boolean  @default(true)
  reminder_defaults    Json?
  export_prefs         Json?
}

model Task {
  id              String    @id @default(cuid())
  user_id         String
  user            User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  title           String
  description     String?
  priority        String    @default("medium") // low | medium | high | urgent
  status          String    @default("pending") // pending | completed | archived
  category_id     String?
  category        Category? @relation(fields: [category_id], references: [id])
  due_date        DateTime?
  due_time        String?
  reminder_at     DateTime?
  recurrence_rule Json?
  is_pinned       Boolean   @default(false)
  is_archived     Boolean   @default(false)
  notes           String?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  completed_at    DateTime?
  reminders       Reminder[]
}

model Habit {
  id              String     @id @default(cuid())
  user_id         String
  user            User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  title           String
  goal            String?
  notes           String?
  category_id     String?
  category        Category?  @relation(fields: [category_id], references: [id])
  reminder_time   String?
  recurrence_rule Json?
  status          String     @default("active") // active | paused | archived
  created_at      DateTime   @default(now())
  updated_at      DateTime   @updatedAt
  habit_logs      HabitLog[]
  streak_summary  StreakSummary?
  reminders       Reminder[]
}

model HabitLog {
  id         String   @id @default(cuid())
  habit_id   String
  habit      Habit    @relation(fields: [habit_id], references: [id], onDelete: Cascade)
  user_id    String
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  date       DateTime @db.Date
  status     String   // completed | skipped | missed
  notes      String?
  logged_at  DateTime @default(now())

  @@unique([habit_id, date])
}

model StreakSummary {
  id                  String    @id @default(cuid())
  habit_id            String    @unique
  habit               Habit     @relation(fields: [habit_id], references: [id], onDelete: Cascade)
  current_streak      Int       @default(0)
  longest_streak      Int       @default(0)
  last_completed_date DateTime?
  updated_at          DateTime  @updatedAt
}

model Category {
  id      String  @id @default(cuid())
  user_id String
  user    User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  name    String
  color   String?
  type    String  // task | habit | both
  tasks   Task[]
  habits  Habit[]
}

model Reminder {
  id          String   @id @default(cuid())
  user_id     String
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  entity_type String   // task | habit
  entity_id   String
  task        Task?    @relation(fields: [entity_id], references: [id], onDelete: Cascade, map: "reminder_task_fk")
  habit       Habit?   @relation(fields: [entity_id], references: [id], onDelete: Cascade, map: "reminder_habit_fk")
  remind_at   DateTime
  is_sent     Boolean  @default(false)
  created_at  DateTime @default(now())
}

model PushSubscription {
  id                  String   @id @default(cuid())
  user_id             String
  user                User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  subscription_object Json
  created_at          DateTime @default(now())
}

model AnalyticsSnapshot {
  id            String   @id @default(cuid())
  user_id       String
  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  snapshot_date DateTime @db.Date
  data          Json
  type          String   // weekly | monthly
}
```

---

## Migration Commands

```bash
# After any schema change
npx prisma migrate dev --name describe_your_change

# On Vercel deploy (production)
npx prisma migrate deploy

# Regenerate client after schema change
npx prisma generate
```

---

## Query Conventions

Always scope queries by `user_id` — never return data without filtering by the authenticated user:

```ts
// ✅ Correct
const tasks = await prisma.task.findMany({
  where: { user_id: uid, status: 'pending' },
  orderBy: { created_at: 'desc' },
});

// ❌ Wrong — no user scope
const tasks = await prisma.task.findMany();
```

Use `select` to avoid over-fetching:

```ts
const habit = await prisma.habit.findUnique({
  where: { id: habitId },
  select: { id: true, title: true, recurrence_rule: true },
});
```
