# DANNA

Personal planner command center. A keyboard-light, drag-heavy weekly planner with a Marathon-poster / cyberpunk aesthetic — built for juggling lectures, labs, clubs, and an endless stream of deadline-only homework.

Built with **React 19 + TypeScript + Vite**, styled with **Tailwind CSS 4** plus hand-rolled CSS, backed by **Supabase** (auth + Postgres + realtime), and installable as a **PWA**.

## Features

- **Four views** — Plan (triage panel), Day, Week, Month
- **Three item kinds**
  - *Events* — time-blocked (solid border)
  - *Tasks* — time-blocked or deadline-only (dashed border + checkbox)
  - *All-day notes* — date-pinned banners
- **Due chips** — tasks with a deadline but no time show in the all-day strip of Day/Week view; check them off there, click to edit, or drag one onto the grid to time-block it. Heavy days collapse to 3 rows with a `+N ▾` expander (Google Calendar-style)
- **Drag & drop everywhere** — drag unscheduled tasks from the sidebar onto the grid, move blocks between days, resize blocks in 15-minute snaps (dnd-kit)
- **Recurrence** — daily/weekly/monthly/yearly rules (rrule) with per-instance overrides: move, retitle, complete, or skip a single occurrence without touching the series; edits ask for *this / future / all* scope
- **Tags** — color-coded, filterable from the sidebar, with weekly/monthly goals
- **i18n** — English and Korean (i18next), including a Korean display font
- **Offline-tolerant PWA** — installable, auto-updating service worker, network-first Supabase caching for reads when the connection drops
- **Adaptive UI scale** — the whole UI zooms with viewport width and the browser's font-size preference, so it stays readable from a 13" high-DPI laptop to a big external monitor
- **Dark / light themes** — tactical-red dark mode and warm-parchment light mode

## Stack

| Layer | Choice |
|---|---|
| UI | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4, CSS custom properties for theming |
| Drag & drop | @dnd-kit |
| Data / auth | Supabase (Postgres, RLS, realtime) |
| Recurrence | rrule + custom per-instance override layer |
| Forms | react-hook-form + zod |
| Dates | date-fns |
| i18n | i18next / react-i18next (en, ko) |
| PWA | vite-plugin-pwa (Workbox) |

## Getting started

### Prerequisites

- Node 18+
- A [Supabase](https://supabase.com) project (free tier is fine)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the database — run the migrations in `supabase/migrations/` against your project (SQL editor or Supabase CLI), in order:

   - `001_schema.sql` — tags, items, recurrence rules, instance overrides
   - `002_rls.sql` — row-level security (each user sees only their own rows)
   - `003_realtime.sql` — realtime publication

3. Configure the environment — create `.env.local`:

   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run it:

   ```bash
   npm run dev
   ```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (port 5173, or `PORT` env) |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Deployment

Deploys as a static SPA — `vercel.json` is set up for Vercel (SPA rewrites + long-cache headers for hashed assets). Set the two `VITE_SUPABASE_*` env vars in your hosting dashboard. Any static host works since all data lives in Supabase.

## Data model

Four tables, all user-scoped by RLS:

- **items** — the single source for tasks, events, and all-day notes (`type` discriminates). `date` without `start_time`/`end_time` = a deadline-only task (rendered as a due chip)
- **tags** — name, color, sort order; items reference one tag
- **recurrence_rules** — one per recurring item (frequency, interval, weekday/month fields, end date)
- **instance_overrides** — per-occurrence deltas for recurring items (moved date/time, retitle, completed, skipped), keyed by the occurrence's original date

Recurring items are expanded client-side for the visible range, then overrides are applied on top — the series row never mutates for single-instance edits.

## Project layout

```
src/
  components/
    calendar/    Day/Week/Month/Plan views, time grid, blocks, all-day strip
    forms/       item form modal, recurrence fields, tag manager
    layout/      app shell, header, bottom sheet, FAB
    sidebar/     unscheduled tasks, tag filter, goals
    ui/          buttons, modal, pickers, theme toggle
  context/       auth, planner data, theme
  hooks/         calendar expansion, drag state, items/tags/rules CRUD
  lib/           date utils, recurrence engine, ui scale, supabase client, offline cache
  pages/         auth, planner, password reset
supabase/
  migrations/    schema, RLS, realtime
```
