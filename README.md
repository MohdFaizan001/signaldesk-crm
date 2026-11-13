# SignalDesk CRM

Full-stack sales CRM. Phase A React UI preserved, now backed by **Express + TypeScript**, **Supabase PostgreSQL + Auth + RLS**, and optional **Google Gemini** / **Resend**.

> **Verified locally:** frontend build, backend typecheck/build, 26 unit tests, `/api/health` smoke test, and startup env validation.
> **Not verified:** live Supabase database/auth, Gemini, and Resend calls — no credentials were available in this environment.

---

## Architecture

```
src/                      React 19 + Vite + Tailwind v4 frontend
├── auth/                 Supabase session + profile context, protected routes
├── services/api.ts       Typed API client (Bearer token, envelopes, DTO mapping)
├── hooks/                TanStack Query hooks + mutations
├── features/             dashboard, leads, pipeline, follow-ups, AI, imports, settings
└── lib/supabase.ts       Browser client using the public anon key

server/src/               Express + TypeScript API
├── config/               Zod-validated env, Gemini client
├── middleware/           auth, validation, rate limits, centralized errors
├── modules/              profiles, leads, activities, followups, dashboard, ai, imports
└── routes/               /api router

supabase/migrations/      PostgreSQL schema, triggers, RLS policies
```

The backend never uses a service-role key. Each request creates a Supabase client with the public anon key plus the caller's JWT, so PostgreSQL RLS applies to every query. Roles and ownership are additionally enforced in backend services.

### Data model

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user; `role` is `admin` or `sales_rep` |
| `leads` | CRM leads, assignment, pipeline status, value, tags |
| `activities` | Call / email / meeting / note timeline per lead |
| `follow_ups` | Scheduled work; **status is derived** from `due_at` + `completed_at` |
| `ai_insights` | Append-only AI snapshots with `provider` (`gemini` or `mock`) |

A signup trigger creates a `sales_rep` profile. A guard trigger blocks self-role changes and role changes by non-admins.

---

## Setup

### 1. Frontend

```bash
npm install
cp .env.example .env       # then set values
npm run dev                # http://localhost:5173
```

`.env`:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon / publishable key>
VITE_API_BASE_URL=http://localhost:3001/api
```

### 2. Database

Run `supabase/migrations/20261113000000_init.sql` in the Supabase SQL Editor (or apply it with the Supabase CLI). It creates enums, tables, indexes, triggers, helper functions, grants, and all RLS policies.

### 3. Backend

```bash
cd server
npm install
cp .env.example .env       # then set values
npm run dev                # http://localhost:3001/api
```

`server/.env`:

```env
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<public anon / publishable key>
GEMINI_API_KEY=            # optional
GEMINI_MODEL=gemini-2.5-flash
RESEND_API_KEY=            # optional
RESEND_FROM_EMAIL=         # optional
```

Startup fails fast if `SUPABASE_URL` or `SUPABASE_ANON_KEY` is missing or malformed.

### 4. First admin (manual)

1. Sign up through the app — the profile is created as `sales_rep`.
2. In the Supabase SQL Editor run:

```sql
update public.profiles set role = 'admin' where email = 'you@company.com';
```

The SQL Editor has no `auth.uid()`, so the escalation guard intentionally allows this maintenance step. There is no self-service role-escalation endpoint.

---

## Scripts

| Location | Command | Description |
|---|---|---|
| root | `npm run dev` | Vite dev server |
| root | `npm run build` | TypeScript project build + production bundle |
| root | `npm run preview` | Preview production build |
| root | `npm run lint` | Oxlint |
| `server/` | `npm run dev` | tsx watch API server |
| `server/` | `npm run build` | Compile to `server/dist` |
| `server/` | `npm start` | Run compiled server |
| `server/` | `npm run typecheck` | TypeScript check without emit |
| `server/` | `npm test` | Vitest unit tests |

---

## API

All responses use `{ success, data, message }`; errors use `{ success: false, message, errors, code? }`.
Everything except `/api/health` requires `Authorization: Bearer <supabase-access-token>`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | Public; reports AI/email configuration |
| GET | `/api/me` | Current profile |
| GET | `/api/profiles` | Team directory |
| PATCH | `/api/profiles/me` | Update own name/avatar |
| PATCH | `/api/profiles/:id/role` | Admin only; cannot change own role |
| GET | `/api/leads` | Search/filter/sort/paginate (`pageSize` ≤ 100) |
| POST | `/api/leads` | Create lead |
| GET | `/api/leads/:id` | Lead detail (RLS-scoped) |
| PATCH | `/api/leads/:id` | Update lead |
| DELETE | `/api/leads/:id` | Admin or creator |
| POST | `/api/leads/import` | Admin only; per-row validation, duplicate detection |
| GET | `/api/leads/export` | CSV export with filters |
| GET | `/api/leads/:id/activities` | Lead timeline |
| POST | `/api/leads/:id/activities` | Log activity |
| PATCH | `/api/activities/:id` | Update activity |
| DELETE | `/api/activities/:id` | Delete activity |
| GET | `/api/follow-ups` | `view=all\|upcoming\|overdue\|completed` |
| POST | `/api/follow-ups` | Create follow-up |
| GET | `/api/follow-ups/:id` | Follow-up detail |
| PATCH | `/api/follow-ups/:id` | Update follow-up |
| PATCH | `/api/follow-ups/:id/complete` | Mark complete |
| DELETE | `/api/follow-ups/:id` | Delete follow-up |
| GET | `/api/dashboard/summary` | KPIs + recent activity + upcoming follow-ups |
| GET | `/api/dashboard/activity` | 6-month leads/revenue series |
| GET | `/api/dashboard/lead-sources` | Source distribution |
| GET | `/api/dashboard/pipeline` | Pipeline counts and values |
| GET | `/api/ai/status` | `configured`, `model`, `mode`, message |
| GET | `/api/ai/insights` | Latest insight per accessible lead |
| GET | `/api/ai/leads/:id/insight` | Latest insight for a lead |
| POST | `/api/ai/leads/:id/insight` | Generate and store a snapshot |
| POST | `/api/ai/chat` | Read-only CRM assistant |
| POST | `/api/ai/search` | Natural-language search → allowlisted filters |
| GET | `/api/ai/daily-summary` | Cached 5 minutes per user |
| POST | `/api/ai/leads/:id/email-draft` | Draft only; never sends |
| POST | `/api/ai/leads/:id/send-email` | Requires Resend; logs an activity on success |

Pagination envelope:

```json
{ "items": [], "pagination": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 1 } }
```

### Security notes

- No secrets in frontend code or git; only the public anon key is shipped to the browser.
- RLS is enabled on every table; reps only access their own/assigned leads and related records.
- Zod validation on every body, query, and param; pagination capped at 100.
- Helmet, CORS allowlist, general and stricter AI rate limits, centralized safe error responses.
- AI inputs are treated as data, never instructions; NL search produces approved filter fields, never SQL.
- AI never writes CRM records. It only appends insight snapshots; email sending is explicit.

---

## AI behaviour (Gemini)

- Configured via `GEMINI_API_KEY`; model via `GEMINI_MODEL` (default `gemini-2.5-flash`).
- Responses use structured JSON validated by Zod.
- Without a key, every AI feature returns **clearly labelled mock/heuristic output** (`provider: "mock"`, `model: "mock-heuristic"`). The UI shows a demo badge and the AI status banner.
- Lead context excludes email and phone. Insights are snapshots and never mutate leads.
- Daily summaries are cached in memory for 5 minutes per user.

## Email (Resend, optional)

Email sending is enabled only when both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set. Otherwise `/send-email` returns `503 EMAIL_NOT_CONFIGURED`; drafts remain available in the lead detail page. Successful sends record an activity.

## CSV import / export

- Parsing and local validation happen in the browser with PapaParse.
- Required columns: Name, Email, Company. Optional: Phone, Job Title, Source, Status, Priority, Deal Value, Notes.
- Rows are validated individually by the API. Duplicate emails inside the CSV and existing database leads are skipped and reported.
- Invalid rows are not imported. Import is admin-only and capped at 500 rows per request.
- Export respects search/status/priority/source filters and returns a CSV download.

---

## Testing

```bash
cd server
npm test          # 26 passing unit tests
npm run typecheck
```

Covered: conversion-rate rounding, monthly activity buckets, derived follow-up status, email normalization/CSV escaping, Zod schema validation, heuristic NL filters, mock insight safety.

These tests do not require Supabase, Gemini, or Resend. Live integration and RLS behaviour must be verified against a configured Supabase project.

## Limitations

- No automated end-to-end/RLS integration suite in this environment.
- Dashboard queries cap loaded rows (5,000 leads / 2,000 follow-ups) for simple in-process aggregation.
- Daily summary cache is per server process and resets on restart.
- Notification preferences are stored locally in the browser; no email scheduler/worker is included.
- No deployment configuration is included.
