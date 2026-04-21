# Project Master Checklist

## Phase 3: Architecture & Deep Tracking

### Group 1: UI Polish & Dark Mode
- [x] Integrate global dark mode
- [x] Optimize cards and inputs for dark mode

### Group 2: Focus & Productivity Tools
- [x] Update Prisma schema for Task Subtasks (`Subtask` model)
- [x] Build `TaskDrawer` UI for managing checklists and subtasks
- [x] Add subtask progress indicators on main task cards
- [x] Connect `TaskDrawer` offline store and APIs

### Group 3: Search, Filter, and Sort
- [x] Update `taskStore.ts` and `habitStore.ts` to manage local search/filter state
- [x] Add search bar, category filter, priority filter, and sort options to Tasks page
- [x] Add search bar and status filter options to Habits page

### Group 4: Archive, Pause, Resume
- [x] Update Task API routes and UI to handle archive (`is_archived: true`, `status: 'archived'`)
- [x] Add "Archived" tab to Tasks page (excluding them from active view)
- [x] Update Habit API routes and UI to handle pause/resume (`status: 'paused'`)
- [x] Exclude paused habits from Today Dashboard

### Group 5: Notes & Better Reminders
- [x] Add `notes` textarea to Task and Habit create/edit modals
- [x] Implement UI to add notes when checking off a Habit
- [x] Add inline controls to easily snooze or reschedule a reminder

### Group 6: Google Calendar Integration (Optional Phase 3)
- [x] Update Prisma schema (`User` and `Task` models)
- [x] Create Google OAuth backend routes (`/api/auth/google/login`, `/api/auth/google/callback`)
- [x] Add "Connect Google Calendar" UI to Settings page
- [x] Implement Task Sync Engine in backend (Create, Update, Delete)
- [x] User provides Google Cloud Client ID and Secret

### Group 7: Routine Templates (Optional Phase 3)
- [x] Define predefined templates in `src/lib/templates.ts`
- [x] Create Templates gallery page (`/templates`)
- [x] Implement Mixed Template generation (Habits + Tasks)
- [x] Add Templates to Sidebar navigation

### Group 8: Advanced Analytics Dashboard
- [x] Backend Data Aggregation (Task vs Habit, Productive Days, Weekly Trend)
- [x] Frontend Charts (LineChart, Donut Chart, BarChart)

### Group 9: Mobile UX Polish
- [x] Fix Mobile Bottom Navigation (More Menu Drawer)
- [x] Fix Horizontal Scrolling on Tasks Page
- [x] Ensure Mobile Settings Access

### Group 10: Premium Glass Theme
- [x] Set up `useDesignStore` and Tailwind `glass` variant
- [x] Implement Glass UI on Layout and Navigation
- [x] Add Glass UI to main pages (Dashboard, Tasks, Habits)
- [x] Add Design Toggle to Settings Page

### Group 11: JS Animations & Interactions
- [x] Install Framer Motion & Canvas Confetti
- [x] Add Confetti burst on Task completion
- [x] Add Staggered Framer Motion to Lists
- [x] Add Page Transitions
  
### Group 12: App Optimization  
