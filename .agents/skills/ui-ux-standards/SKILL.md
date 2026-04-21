---
name: ui-ux-standards
description: Use when building any UI component, page layout, form, modal, loading state, empty state, error state, or any visual element. These are the design rules for this project.
---

# UI/UX Standards

## Use this skill when
- Building any React component or page
- Implementing forms, modals, or dialogs
- Adding loading, error, or empty states
- Implementing destructive actions (delete, archive)
- Building the Dashboard or any data display
- Doing any responsive layout work

---

## Design Feel

- **Clean, modern, calm** — no visual clutter
- **Color palette:** 2–3 primary colors with neutral backgrounds
- **Mobile-first:** All primary actions must be reachable with one thumb on a 375px screen
- **Simple on the surface, powerful underneath**

---

## Loading States — Skeleton Loaders Only

**Never use spinners.** Always use skeleton loaders.

```tsx
// ✅ Correct
function TaskListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ❌ Wrong
<Spinner /> // Never
<div className="loading-spinner" /> // Never
```

---

## Empty States — Always Friendly

Never show blank whitespace. Every empty state must:
1. Have a friendly illustration or icon
2. Explain what's empty in plain language
3. Guide the user to create their first item

```tsx
function EmptyTaskState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">✅</div>
      <h3 className="text-lg font-medium text-gray-800">No tasks yet</h3>
      <p className="text-sm text-gray-500 mt-1">Add your first task to get started</p>
      <button onClick={onAdd} className="mt-4 btn-primary">
        Add Task
      </button>
    </div>
  );
}
```

---

## Destructive Actions — Always Require Confirmation

Delete and archive must always show a confirmation dialog before executing.

```tsx
function DeleteConfirmDialog({ itemName, onConfirm, onCancel }) {
  return (
    <div className="modal">
      <h2>Delete "{itemName}"?</h2>
      <p className="text-sm text-gray-500">This action cannot be undone.</p>
      <div className="flex gap-3 mt-4">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} className="btn-danger">Delete</button>
      </div>
    </div>
  );
}
```

---

## Forms — Inline Validation

- Validate inline as user types or on blur — never on full-page reload
- Show error messages directly below the relevant field
- Required fields: validate on submit attempt, not on first render
- Clear error when user starts correcting

```tsx
// Error shown inline, below the field
<div>
  <input
    value={title}
    onChange={e => setTitle(e.target.value)}
    className={cn('input', error && 'input-error')}
    placeholder="Task title"
  />
  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
</div>
```

---

## Quick Add — ≤2 Taps Rule

The quick add button on Dashboard must:
- Open in ≤2 taps/clicks from any Dashboard view
- Submit in ≤2 taps/clicks (title + submit)
- Be accessible from the Dashboard without scrolling on mobile
- Use a floating action button or a sticky input at the bottom on mobile

---

## Key Metrics — Visually Prominent on Dashboard

These must be immediately visible without scrolling:
- Today's streak count per habit
- Today's completion % (tasks done / total tasks today)
- Missed habits count

Use large, bold numbers with clear labels. Not buried in cards.

---

## Responsive Breakpoints

| Size | Width | Notes |
|---|---|---|
| Mobile | 375px | Primary target — one-thumb reach |
| Tablet | 768px | Two-column layouts acceptable |
| Desktop | 1280px | Sidebar + main content layout |

---

## Toasts / Notifications

- Success: green, auto-dismiss after 3s
- Error: red, stays until dismissed
- Info/sync: neutral, auto-dismiss after 2s
- Position: bottom-center on mobile, bottom-right on desktop
- Never show more than 2 toasts at once

---

## Component Checklist

Before marking any component done, verify:
- [ ] Has loading skeleton (not spinner)
- [ ] Has empty state (not blank whitespace)
- [ ] Destructive actions have confirmation
- [ ] Forms have inline validation
- [ ] Works on 375px mobile
- [ ] Works on 1280px desktop
- [ ] Key actions reachable with one thumb on mobile
