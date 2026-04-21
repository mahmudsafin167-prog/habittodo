
PRODUCT BRIEF
Personal Productivity Web App

Version 3.0  Â·  Final  Â·  For Developer Team

â—†  PROJECT OVERVIEW
Product Name
Personal Productivity Web App
Platform
Web App â€” PWA (installable from browser, no native app required)
Target User
Individual / Personal Use â€” single user, not a team tool
Frontend
Next.js 14+ with React (App Router)
Backend
Next.js API Routes â€” hosted on Vercel (no separate backend server needed)
Database
PostgreSQL via Supabase (Free Tier)
ORM
Prisma
Authentication
Firebase Auth â€” Email/Password + Google OAuth
Push Notifications
Web Push API (VAPID keys) via Vercel Cron Jobs
Styling
Tailwind CSS
State Management
Zustand
Charts & Analytics
Recharts
Timezone Handling
date-fns-tz
Cron / Reminders
Vercel Cron Jobs (free: checks reminders every hour)
Hosting â€” All-in-one
Vercel (frontend + backend API routes together)
Hosting â€” Database
Supabase Free Tier â€” 500MB PostgreSQL, 2GB bandwidth
Self-hosting
Fully portable â€” can migrate to any VPS/server in future with zero code changes

âš ï¸  Reminder precision note: Vercel free tier Cron Jobs run hourly (not every minute). Reminders will fire within ~1 hour of the set time. This is acceptable for personal use. If exact-minute reminders are needed in future, migrate backend to a self-hosted VPS and use node-cron.

ðŸ“¦  Self-hosting note: This app is fully portable. If you want to move off Vercel/Supabase in future, deploy Next.js on any VPS (DigitalOcean, Hetzner, etc.), install PostgreSQL locally, and replace Vercel Cron with node-cron. Zero code changes required â€” only environment variables change.


â—†  PRODUCT VISION
This app is a personal operating system for daily productivity. It combines task management, habit building, and progress analytics into one unified, distraction-free system. The product should feel simple on the surface but powerful underneath â€” helping the user organize their day, build consistency, and understand their long-term patterns.

This is NOT a team collaboration tool. It is NOT a project management system. It is a focused personal tool built for one userâ€™s daily workflow.

â—†  AUTHENTICATION FLOW
Use Firebase Auth as the sole auth layer. The backend must verify Firebase ID tokens on every protected API request. Do not build a custom auth system.

Registration â€” Step by Step
User opens the app and sees a Sign Up screen.
User enters email + password OR clicks â€œContinue with Googleâ€.
Firebase Auth creates the user account and returns an ID token.
Frontend immediately calls POST /api/users/init with the Firebase ID token in the Authorization header.
Backend verifies the token via Firebase Admin SDK, creates a user row in PostgreSQL (id, email, display_name, timezone, created_at), and returns the user profile.
Frontend stores the profile in Zustand. User is redirected to Dashboard.

Login â€” Step by Step
User enters email + password OR clicks â€œContinue with Googleâ€.
Firebase Auth validates and returns a fresh ID token.
Frontend keeps the token in memory only â€” never in localStorage or cookies.
Token is sent on every API call as: Authorization: Bearer <token>.
Backend verifies via Firebase Admin SDK middleware on every request.
Firebase SDK auto-refreshes expired tokens silently. No manual re-login unless user explicitly signs out.

Session Rules
Token lives in memory only â€” never localStorage, never cookies
Token refresh is automatic via Firebase SDK â€” developer must not write manual refresh logic
On page reload, Firebase SDK restores session via IndexedDB â€” user stays logged in
Sign out: call Firebase signOut() + clear Zustand state + redirect to /login
All pages except /login and /register must redirect to /login if no valid Firebase session

Error Handling
Wrong password
Show inline: â€œIncorrect email or passwordâ€
Email already exists
Show: â€œAn account with this email already exists. Try logging in.â€
Google account conflict
Show: â€œThis email is linked to a password account. Please log in with email.â€
Network failure
Show: â€œCould not connect. Please check your internet connection.â€
/api/users/init fails
Sign user out of Firebase + show: â€œAccount setup failed. Please try again.â€


â—†  REMINDER SYSTEM & OFFLINE RULES
How Reminders Work
User sets a reminder on a task or habit. Frontend sends remind_at timestamp to backend, stored in reminders table with is_sent: false.
Vercel Cron Job calls /api/cron/reminders every hour automatically.
That endpoint queries all reminders where remind_at <= now AND is_sent = false.
For each due reminder, backend sends a Web Push notification to the userâ€™s registered push subscription.
After sending, is_sent is set to true. Notification never sends twice.

Push Subscription Flow
On first login, frontend requests browser notification permission.
If granted, frontend generates a push subscription object and sends it to POST /api/push/subscribe.
Backend stores the subscription object linked to the user in push_subscriptions table.
If user denies permission: show in-app reminder badge on Dashboard as fallback. Do not retry push permission â€” user must enable from browser settings manually.

Offline Behavior
Strategy: Service Worker handles offline. Server always wins on sync â€” with one exception: completions are always preserved.

Works Offline
View Dashboard, Tasks, Habits (cached data from last sync)
Mark a task complete or incomplete
Mark a habit complete or skip for today
Offline actions are queued in IndexedDB as pending operations

Does NOT Work Offline
Creating a new task or habit â€” block in UI with message: â€œNo internet. Please reconnect to create new items.â€
Editing task or habit details
Deleting tasks or habits
Analytics and Calendar pages â€” not cached
Scheduling new reminders

Conflict Resolution Rules

RULE 1
Completion wins â€” If user marks task/habit complete offline and it was modified on another device, keep the completion. Server merges: completed_at from offline, other field updates from server.

RULE 2
Server wins on edits â€” Edit task details offline is blocked in UI. If it somehow occurs, server version overwrites. Show toast: â€œSome offline changes were overwritten by a newer version.â€

RULE 3
Delete beats complete â€” If task was deleted on one device and completed offline on another, deletion wins. The completion is discarded silently.

RULE 4
Queue order â€” Offline actions replay in the order they were queued. If a queued action fails (e.g. task deleted server-side), drop it silently and refresh UI from server state.

RULE 5
Sync on reconnect â€” When navigator.onLine fires, flush the full pending queue immediately before fetching fresh server data.


â—†  DEVELOPMENT PHASES
Phase 1 â€” MVP
Ship Phase 1 completely before touching Phase 2 or 3. No exceptions.

User authentication (Firebase Auth â€” Email + Google OAuth)
Dashboard â€” todayâ€™s tasks, todayâ€™s habits, streak summary, quick add, progress bar
Task management â€” full CRUD, priority, due date, recurring tasks, views: Today / Upcoming / Overdue / Completed
Habit management â€” create, edit, pause, resume, delete, repeat rules, auto completion logging
Streak tracking â€” calculated from habit_logs, never stored as a raw counter
Reminder system â€” Web Push via Vercel Cron Job (hourly check)
Responsive design â€” mobile-first, works on all screen sizes
PWA â€” Service Worker, offline cache for Dashboard + Today views, installable from browser
History logging â€” every completion / skip / miss recorded in habit_logs

Phase 1 â€” MVP Non-Goals
The items below are explicitly OUT OF SCOPE for Phase 1. Do not build them early â€” scope creep will delay the MVP.

Analytics page
Calendar / History page
Category and tags
Search, filter, and sort
Notes per check-in
Subtasks and checklists
Routine templates
Dark mode
CSV / PDF export
Google Calendar integration
Mood tracking
Pomodoro / Focus Mode
Email reminders
Motivational badges or milestones
Multi-user or team features â€” never (this is a personal app)

Phase 2 â€” Core Enhancement
Analytics & Insights page â€” streaks, heatmaps, completion rates, trend comparison
Calendar / History page â€” monthly view, daily drill-down, performance summary
Category and tags for tasks and habits
Search, filter, and sort across all views
Archive, pause, resume for tasks and habits
Notes per task and per habit check-in
Better reminder controls â€” snooze, reschedule

Phase 3 â€” Optional / Future
Routine templates â€” morning, study, workout, sleep
Subtasks and checklists inside tasks and habits
Motivational milestones and badges
CSV and PDF export
Google Calendar integration
Dark mode and theme customization
Mood tracking with habit completion
Pomodoro / Focus Mode timer
Advanced trend detection and insights
Email reminders â€” low priority


â—†  CORE FEATURE SPECIFICATIONS
Tasks
CRUD: create, edit, delete, complete, archive, pin
Fields: title, description, priority (low / medium / high / urgent), category, due_date, due_time, reminder_at, notes, status (pending / completed / archived)
Recurrence: one-time, daily, weekdays, selected days, weekly, monthly, custom interval
Views: Today, Upcoming, Overdue, Completed, All

Habits
Actions: create, edit, pause, resume, archive, delete
Fields: title, goal, notes, category, reminder_time, recurrence_rule, status (active / paused / archived)
Repeat rules: daily, weekdays, selected days, weekly, monthly, custom interval
Every completion, skip, or missed day is auto-logged in habit_logs
Streak is calculated from habit_logs â€” not stored as a counter (prevents desync)

Analytics (Phase 2)
Current streak and longest streak per habit
Weekly and monthly completion rate
Calendar heatmap (GitHub-style) per habit
Missed days count and pattern detection
Overall consistency score
Trend comparison: this week vs last week

â—†  REQUIRED PAGES
Dashboard
Todayâ€™s tasks with completion toggle
Todayâ€™s habits with check-off and skip option
Streak summary widget per habit
Progress bar: tasks done / total tasks today
Quick add â€” â‰¤2 taps to open, â‰¤2 taps to submit
Remaining items count

Tasks Page
Full task list â€” list view (Phase 1), board + calendar view (Phase 2)
Search, filter, sort â€” Phase 2
Inline status toggle and quick edit

Habits Page
Habit cards: title, streak count, todayâ€™s completion state, repeat rule
Grouping by category â€” Phase 2
Filter: active / paused / archived â€” Phase 2

Calendar / History Page (Phase 2)
Monthly calendar â€” each day shows completed tasks and habits count
Daily drill-down: what was completed, what was missed
Monthly performance summary

Insights / Analytics Page (Phase 2)
Per-habit streak chart and heatmap
Overall weekly and monthly completion rate
Trend graphs via Recharts
Habit consistency ranking

Settings Page
Profile: name, avatar, timezone
Notifications: enable/disable, default reminder time
Theme: light / dark / system â€” dark mode Phase 3
Export: CSV or PDF â€” Phase 3
Account: change email, change password, delete account


â—†  DATA MODEL
All entities below must exist in PostgreSQL. Managed via Prisma ORM.

users â€” id, email, display_name, avatar_url, timezone, created_at, settings_id
tasks â€” id, user_id, title, description, priority, status, category_id, due_date, due_time, reminder_at, recurrence_rule, is_pinned, is_archived, notes, created_at, updated_at, completed_at
habits â€” id, user_id, title, goal, notes, category_id, reminder_time, recurrence_rule, status, created_at, updated_at
habit_logs â€” id, habit_id, user_id, date, status (completed / skipped / missed), notes, logged_at
categories â€” id, user_id, name, color, type (task / habit / both)
reminders â€” id, user_id, entity_type, entity_id, remind_at, is_sent, created_at
push_subscriptions â€” id, user_id, subscription_object (JSON), created_at
streak_summaries â€” id, habit_id, current_streak, longest_streak, last_completed_date, updated_at
analytics_snapshots â€” id, user_id, snapshot_date, data (JSON), type (weekly / monthly)
user_settings â€” id, user_id, theme, notification_enabled, reminder_defaults (JSON), export_prefs

â—†  UX & DESIGN REQUIREMENTS
Design feel: clean, modern, calm â€” no visual clutter
Color palette: 2â€“3 primary colors with neutral backgrounds
Key metrics (streak, todayâ€™s completion %, missed habits) must be visually prominent on Dashboard
Quick add: â‰¤2 taps/clicks to open, â‰¤2 taps/clicks to submit
Destructive actions (delete, archive): always require confirmation
Empty states: friendly, guide user to create first item â€” never show blank whitespace
Loading states: skeleton loaders only, no spinners
Forms: inline validation, clear error messages, no full-page reload on error
Mobile: all primary actions reachable with one thumb on a 375px screen

â—†  ACCEPTANCE CRITERIA
Product is ready for handover when ALL of the following pass:

User can register and log in with email or Google
Page refresh does not log the user out
Wrong password shows correct error message, not a generic crash
User can create, complete, edit, and delete tasks with all fields
User can create a recurring habit and log completions daily
Streak count updates automatically and correctly from habit_logs
Dashboard shows accurate todayâ€™s tasks and habits on every load
Web Push reminder fires within 1 hour of the set reminder time
Offline: user can view Dashboard and check off a habit, action syncs on reconnect
App renders correctly on 375px mobile, 768px tablet, and 1280px desktop
All data persists correctly after page reload
No critical bugs in task or habit CRUD flows

â—†  FINAL INSTRUCTION TO DEVELOPER TEAM
Build this product as a serious, polished, and scalable web application. Use the tech stack specified in this brief exactly â€” do not substitute without discussion.

Follow the phased approach strictly. Ship Phase 1 first. Do not start Phase 2 or 3 until Phase 1 is complete, tested, and stable.

Priorities in order: user experience, data correctness, recurrence logic, push reminders, streak accuracy, offline sync, clean UI/UX.

The final product should feel professional, stable, and thoughtfully designed for long-term daily personal use.


