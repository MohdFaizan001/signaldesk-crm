# SignalDesk — Phase A: Frontend Development

## Status: ✅ Complete

## Overview

Phase A delivers a fully functional, professionally designed frontend for **SignalDesk**, an AI-powered CRM platform. All 8 application pages are implemented with working interactions, realistic mock data, responsive layouts, and a consistent design system.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4 (v4 plugin for Vite)
- React Router v7
- React Hook Form + Zod (form validation)
- Recharts (data visualization)
- Lucide React (icons)
- dnd-kit (drag-and-drop pipeline)
- Sonner (toast notifications)
- date-fns, clsx, tailwind-merge (utilities)

## Pages Implemented

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Metrics, charts, activity feed, follow-ups, AI summary |
| Leads | `/leads` | Data table with search, filters, sort, pagination, CRUD |
| Lead Detail | `/leads/:id` | Profile, activity timeline, AI intelligence tab |
| Pipeline | `/pipeline` | Kanban board with drag-and-drop across 6 stages |
| Follow-ups | `/follow-ups` | Overdue/upcoming/completed tabs with completion actions |
| AI Workspace | `/ai` | Lead intelligence table + chat assistant interface |
| Import/Export | `/import-export` | CSV upload with preview + CSV export |
| Settings | `/settings` | Profile, team, appearance, notification preferences |

## Working Interactions

- ✅ Full page navigation with sidebar
- ✅ Search leads by name/company/email
- ✅ Filter by status, priority, source
- ✅ Sort by name, deal value, date
- ✅ Paginated leads table
- ✅ Add lead via validated form
- ✅ Edit existing leads
- ✅ Delete with confirmation dialog
- ✅ View lead detail with activity timeline
- ✅ AI intelligence tab per lead (score, actions, risks)
- ✅ Drag-and-drop pipeline stage changes
- ✅ Complete follow-ups
- ✅ AI chat with sample responses
- ✅ CSV file upload + preview
- ✅ CSV export (downloads file)
- ✅ Toast notifications
- ✅ Dark mode toggle
- ✅ Notification dropdown
- ✅ Settings toggles
- ✅ Mobile responsive sidebar

## Design System

- **Palette**: Off-white background (#F7F8FA), white surfaces, charcoal sidebar (#17212F), cobalt accent (#4263D8), muted teal secondary
- **Typography**: Inter font, consistent sizing (xs-xl), controlled weights
- **Components**: Button, Input, Select, Textarea, Badge, Avatar, Card, Dialog, Tabs, Dropdown, SearchInput, EmptyState, LoadingSpinner, ConfirmDialog
- **Dark mode**: CSS custom properties swap on `html.dark`

## Project Structure

```
src/
├── components/
│   ├── ui/          # Reusable design system components
│   ├── layout/      # AppShell, Sidebar, Topbar
│   └── charts/      # Recharts wrapper components
├── features/
│   ├── dashboard/   # Dashboard page
│   ├── leads/       # Leads table, detail page, form
│   ├── pipeline/    # Kanban pipeline with dnd-kit
│   ├── followups/   # Follow-up management
│   ├── ai/          # AI workspace + chat
│   ├── imports/     # CSV import/export
│   └── settings/    # User settings
├── data/            # Mock data (15 leads, activities, follow-ups, AI insights)
├── services/        # Mock API service layer (replaceable in Phase B)
├── hooks/           # useLeads, useFollowUps, useDarkMode, useMobileSidebar
├── types/           # TypeScript interfaces
└── utils/           # Helpers (cn, formatCurrency, formatDate, status/priority config)
```

## Phase B Requirements

To connect the backend, replace the functions in `src/services/mockService.ts` with real API calls. The service layer is isolated — no component directly imports mock data for mutations.

**Phase B needs to provide:**

1. REST/GraphQL API for leads CRUD
2. Authentication (login, JWT, roles)
3. Real AI integration (lead scoring, chat)
4. Database persistence
5. CSV processing backend
6. Real-time notifications (WebSocket)
7. File uploads for user avatars

## Build

```bash
npm install
npm run dev    # Development server
npm run build  # Production build
```
