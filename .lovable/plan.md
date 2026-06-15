# AI Workplace Productivity Assistant — MVP Plan

Building the 3-feature MVP with the "Architectural precision" design direction (clean, blue #2563EB, Inter, sidebar-driven SaaS).

## Scope

- **3 AI tools**: Smart Email Generator, Meeting Notes Summarizer, AI Task Planner
- **Dashboard** with live stats (counts of items generated)
- **Sidebar navigation** (collapsible on desktop, drawer on mobile)
- **Persisted history** — every generation saved to DB, viewable later
- **No auth** — open access; stats are global across all visitors
- **AI disclaimer** on every tool page
- **Dark mode** support

## Pages / Routes

```
/                       Dashboard (stats + recent activity)
/email                  Smart Email Generator
/meetings               Meeting Notes Summarizer
/tasks                  AI Task Planner
/history/email/$id      View saved email
/history/meeting/$id    View saved meeting summary
/history/task/$id       View saved task plan
```

## Tool UX (shared pattern)

Two-column layout: **Input panel** (left, narrower) → **Output panel** (right, wider) that fades/slides in when content arrives. Each output panel has Copy / Export actions and a footer AI disclaimer.

- **Email Generator**: purpose, recipient, tone (Formal/Friendly/Persuasive), instructions → subject + body (both editable, copyable).
- **Meeting Summarizer**: paste notes → Executive Summary, Key Decisions, Action Items, Deadlines, Responsible Persons. Export to PDF (client-side via `jspdf`).
- **Task Planner**: tasks list, available hours, priority → prioritized list, daily schedule, time estimates, productivity tips.

## Tech / Implementation

- **Stack**: TanStack Start (existing), Tailwind v4, shadcn/ui, Framer Motion for transitions, lucide-react icons.
- **AI**: Lovable AI Gateway via AI SDK (`google/gemini-3-flash-preview`). Each tool = one `createServerFn` returning structured output (`Output.object` with Zod schema) so we can render fields cleanly.
- **Database** (Lovable Cloud): three tables, public (no auth) write/read.
  - `emails` (id, purpose, recipient, tone, instructions, subject, body, created_at)
  - `meeting_summaries` (id, notes, summary, decisions jsonb, action_items jsonb, deadlines jsonb, created_at)
  - `task_plans` (id, tasks, hours, priority, prioritized jsonb, schedule jsonb, tips jsonb, created_at)
  - RLS: enable, allow anon SELECT + INSERT (no UPDATE/DELETE). Dashboard counts via `count` queries.
- **History**: each tool page shows a small "Recent" list pulled from the table; clicking opens the saved record.
- **PDF Export** (Meetings): `jspdf` client-side.

## Design (Architectural Precision direction)

- Primary `#2563EB`, neutral zinc surfaces, soft ring-1 borders, rounded-xl cards.
- Inter for body, Poppins for headings.
- Tokens added to `src/styles.css` (light + dark).
- Sidebar uses shadcn `Sidebar` component (collapsible="icon"), hamburger drawer on mobile.
- Subtle motion: route fade, output slide-up, shimmer "Thinking…" while AI generates.

## File Structure

```
src/
  routes/
    __root.tsx                  (sidebar layout + providers)
    index.tsx                   (Dashboard)
    email.tsx                   (Email Generator)
    meetings.tsx                (Meeting Summarizer)
    tasks.tsx                   (Task Planner)
    history.email.$id.tsx
    history.meeting.$id.tsx
    history.task.$id.tsx
  components/
    app-sidebar.tsx
    ai-disclaimer.tsx
    output-panel.tsx
    stat-card.tsx
    thinking-shimmer.tsx
  lib/
    ai-gateway.server.ts        (Lovable AI provider helper)
    email.functions.ts          (generateEmail, listEmails, getEmail server fns)
    meetings.functions.ts
    tasks.functions.ts
    stats.functions.ts          (dashboard counts)
```

## Build Order

1. Enable Lovable Cloud + create the 3 tables (migration with GRANTs + RLS).
2. Design tokens in `src/styles.css` + fonts.
3. Sidebar layout in `__root.tsx` + `app-sidebar.tsx`.
4. AI gateway helper + the 3 server functions (structured output).
5. Dashboard with stat cards (live counts).
6. Email Generator page (full input/output/copy/save/recent).
7. Meeting Summarizer page (+ PDF export).
8. Task Planner page.
9. History viewer routes.
10. Polish: dark mode toggle, mobile drawer, animations, disclaimers.
