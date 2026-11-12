# SignalDesk CRM

A modern sales CRM frontend built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**.  
SignalDesk runs entirely in **mock mode** — no backend, database, or external API required.

---

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173
```

Build for production:

```bash
npm run build      # TypeScript check + Vite build → dist/
npm run preview    # Preview the production build locally
```

---

## Features

| Area             | Description                                                         |
|------------------|---------------------------------------------------------------------|
| **Dashboard**    | KPIs derived from live mock data, charts (Recharts), AI summary     |
| **Leads**        | Full CRUD with Zod validation, search, filters, inline editing      |
| **Lead Detail**  | Contact info, activity timeline with **Log Activity** dialog, AI insights |
| **Pipeline**     | Drag-and-drop Kanban board (dnd-kit) — drop on columns *or* cards   |
| **Follow-ups**   | Overdue / upcoming / completed tabs, **Create Follow-up** dialog    |
| **AI Workspace** | Chat interface with sample responses (backend integration pending)  |
| **Import/Export** | CSV import with header & row validation, error display; CSV export |
| **Settings**     | Profile, team list, appearance (dark/light), notification prefs     |

---

## Architecture

```
src/
├── components/
│   ├── charts/       # Recharts wrappers (area, bar, donut)
│   ├── layout/       # AppShell, Sidebar, Topbar
│   └── ui/           # Design system: Button, Card, Dialog, Badge, …
├── data/
│   └── mockData.ts   # All seed data (leads, activities, follow-ups, AI insights)
├── features/
│   ├── dashboard/    # DashboardPage — KPIs computed from mockService
│   ├── leads/        # LeadsPage, LeadDetailPage, LeadForm
│   ├── pipeline/     # PipelinePage — Kanban with dnd-kit
│   ├── followups/    # FollowUpsPage — tabs + create dialog
│   ├── ai/           # AIWorkspacePage — chat with mock responses
│   ├── imports/      # ImportExportPage — CSV validation & import
│   └── settings/     # SettingsPage — profile, team, theme, notifications
├── hooks/            # useLeads, useFollowUps, useDarkMode, useMobileSidebar
├── services/
│   └── mockService.ts  # In-memory CRUD — swap for real API in Phase B
├── types/            # TypeScript interfaces (Lead, Activity, FollowUp, …)
├── utils/            # cn(), formatCurrency, formatDate, configs
├── App.tsx           # Router (react-router-dom v7)
├── main.tsx          # Entry point
└── index.css         # Tailwind v4 @theme tokens, dark mode, animations
```

---

## Mock Mode

All data lives in memory via `src/services/mockService.ts`.  
Operations (`createLead`, `updateLead`, `createFollowUp`, `createActivity`, `importLeadsFromCSV`, …) mutate an in-memory array and simulate network delay.  
Refreshing the page resets to seed data.

**To connect a real backend:** replace the function bodies in `mockService.ts` with `fetch`/`axios` calls — the rest of the app uses the same async interface.

---

## Dark Mode

Theme preference is saved to `localStorage` (`signaldesk-theme`).  
On load, the saved theme is applied immediately via `useDarkMode`. Toggle via the moon/sun icon in the topbar.

---

## Tech Stack

- **React 19** + **React Router 7**
- **TypeScript 7**
- **Tailwind CSS v4** with `@theme` design tokens
- **Vite 8** + `@vitejs/plugin-react`
- **Recharts** — area, bar, donut charts
- **dnd-kit** — drag-and-drop pipeline
- **react-hook-form** + **Zod** — form validation
- **Sonner** — toast notifications
- **Lucide React** — icons

---

## Scripts

| Command         | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Start dev server with HMR            |
| `npm run build` | Type-check + production build        |
| `npm run lint`  | Run Oxlint                           |
| `npm run preview` | Preview production build           |

---

## License

Internal project — not published.
