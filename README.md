# SignalDesk CRM

**An AI-assisted customer relationship management platform for managing
leads, tracking sales activity, and planning follow-ups.**

SignalDesk brings lead management, a visual sales pipeline, customer
interaction history, follow-up tracking, dashboard analytics, and
AI-assisted sales insights into one workspace.

> **Project status and verification**
>
> The project README supplied for this revision reports that the
> frontend production build, backend TypeScript build/type-check, 26
> backend unit tests, `/api/health` smoke test, and startup environment
> validation were verified locally.
>
> Live Supabase database/authentication, Gemini API, and Resend email
> operations were **not verified** in that environment because live
> credentials were unavailable. Do not interpret a successful local
> build or unit test run as proof that those external integrations are
> working.
>
> Before submitting, replace the deployment placeholders in this
> document with the real URLs and complete the production verification
> checklist.

------------------------------------------------------------------------

## Table of contents

-   [Project overview](#project-overview)
-   [Core features](#core-features)
-   [Technology stack](#technology-stack)
-   [Application architecture](#application-architecture)
-   [Database design](#database-design)
-   [Getting started](#getting-started)
-   [Environment variables](#environment-variables)
-   [Database setup](#database-setup)
-   [First administrator setup](#first-administrator-setup)
-   [Available scripts](#available-scripts)
-   [API reference](#api-reference)
-   [Authentication and security](#authentication-and-security)
-   [AI functionality](#ai-functionality)
-   [Email functionality](#email-functionality)
-   [CSV import and export](#csv-import-and-export)
-   [Testing and verification](#testing-and-verification)
-   [Deployment](#deployment)
-   [Known limitations](#known-limitations)
-   [Future improvements](#future-improvements)

------------------------------------------------------------------------

## Project overview

Sales teams need a reliable way to keep customer information, sales
progress, conversations, and follow-up tasks organized. When these
activities are spread across different tools or tracked manually, it
becomes harder to identify promising leads, remember the next action,
and understand the overall sales pipeline.

**SignalDesk** is a full-stack CRM application designed to bring these
workflows together. It provides a central place to manage leads, record
interactions, monitor pipeline progress, schedule follow-ups, and review
sales activity. AI-assisted features can use available CRM context to
generate lead insights and support sales decisions.

### Project objectives

-   Centralize lead and customer information.
-   Make sales-stage progress visible through a pipeline.
-   Keep a chronological record of customer interactions.
-   Help users organize upcoming and overdue follow-ups.
-   Present useful sales metrics and activity summaries.
-   Provide AI-assisted insights while keeping CRM data and actions
    under application control.
-   Apply authentication, role checks, and database-level access
    policies.

------------------------------------------------------------------------

## Core features

### 1. Dashboard

The dashboard provides an overview of CRM activity, including:

-   Lead and customer metrics.
-   Sales pipeline information.
-   Recent activity.
-   Upcoming follow-ups.
-   Lead-source distribution and activity trends.

Dashboard values are derived from CRM data returned by the backend.
Review the implementation and production data before using screenshots
or sample figures in a formal submission.

### 2. Lead management

Users can work with lead records through the CRM interface and API.

Supported operations include:

-   Create a lead.
-   View lead details.
-   Update lead information.
-   Search and filter leads.
-   Delete a lead, subject to authorization rules.
-   Import leads from CSV (administrator-only).
-   Export filtered lead data to CSV.

The data model supports lead assignment, pipeline status, value, and
tags. The exact field definitions and constraints are maintained in the
Supabase migration.

### 3. Sales pipeline

The pipeline organizes leads by their current sales stage and provides a
visual way to follow progress. Moving a lead to another stage updates
its stored status through the application.

### 4. Customer interaction history

Activities can be associated with a lead to maintain a timeline of
customer interactions, including:

-   Calls.
-   Emails.
-   Meetings.
-   Notes.

Activities can be created, updated, and deleted through the API, subject
to access policies.

### 5. Follow-up management

Users can schedule follow-up work and review follow-ups by category:

-   All.
-   Upcoming.
-   Overdue.
-   Completed.

A follow-up's status is derived from its due date and completion
timestamp rather than being treated as an independently editable status
field.

### 6. AI workspace

The AI module is designed to support CRM workflows with:

-   Lead insight generation.
-   A read-only CRM assistant.
-   Natural-language lead search translated into approved filters.
-   Daily sales summaries.
-   Personalized email drafts.

AI output is validated before being used by the application. The AI
assistant is read-only: it does not directly create, update, or delete
CRM records.

### 7. Team roles and profiles

The application supports two profile roles:

-   **Admin** --- access to administrator-restricted operations, such as
    CSV import and role management.
-   **Sales representative** --- standard CRM access constrained by the
    configured ownership and assignment policies.

New signups receive the `sales_rep` role by default. Administrator
promotion is a controlled database maintenance operation; there is no
self-service role-escalation endpoint.

### 8. CSV import and export

The application supports CSV-based lead import and export. Import
includes row-level validation and duplicate detection. Invalid or
duplicate rows are reported rather than silently treated as successfully
imported.

------------------------------------------------------------------------

## Technology stack

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                React 19                User interface

  Frontend tooling        Vite                    Development server and
                                                  production build

  Language                TypeScript              Type safety across the
                                                  application

  Styling                 Tailwind CSS v4         UI styling

  Routing and data        React Router, TanStack  Navigation, server
                          Query                   state, and mutations

  Forms and validation    React Hook Form, Zod    Form handling and
                                                  validation

  Backend                 Node.js, Express,       REST API and business
                          TypeScript              logic

  Database                Supabase PostgreSQL     Persistent relational
                                                  data

  Authentication          Supabase Auth           User authentication and
                                                  sessions

  Authorization           PostgreSQL Row Level    Data-access enforcement
                          Security (RLS) and      
                          backend checks          

  AI                      Google Gemini API, with AI-assisted CRM
                          mock/heuristic fallback features

  Email                   Resend (optional)       Sending emails when
                                                  configured

  CSV                     PapaParse               Browser-side CSV
                                                  parsing

  Testing                 Vitest                  Backend unit tests
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Application architecture

SignalDesk uses a separate frontend and backend.

1.  The React frontend authenticates users with Supabase Auth.
2.  The frontend sends requests to the Express API with the user's
    Supabase access token.
3.  The backend validates the request and creates a Supabase client
    using the public anon key together with the caller's JWT.
4.  PostgreSQL Row Level Security evaluates the caller's permissions for
    database operations.
5.  Backend services apply additional ownership and role checks.
6.  The API returns a consistent response envelope to the frontend.

The backend does **not** use a Supabase service-role key. This is
intentional: database queries run in the context of the authenticated
caller so that RLS policies remain active.

### High-level request flow

``` text
User
 |
 v
React + Vite frontend
 |
 | Supabase session / access token
 v
Express REST API
 |
 | Validate token, input, role and ownership
 v
Supabase client (public anon key + caller JWT)
 |
 v
PostgreSQL + Row Level Security
```

AI requests follow a separate provider path from the backend:

``` text
React AI Workspace
 |
 v
Express AI module
 |
 +---- Gemini configured? ---- Yes ----> Gemini API
 |                                  |
 |                                  v
 |                           Validate structured output
 |
 +---- No / unavailable ----------------> Mock or heuristic provider
 |
 v
Return provider-labelled result to frontend
```

### Repository structure

``` text
.
├── public/                    # Static frontend assets
├── src/                       # React frontend
│   ├── auth/                  # Supabase session and profile context
│   ├── services/              # Typed API client
│   ├── hooks/                 # TanStack Query hooks and mutations
│   ├── features/              # Dashboard, leads, pipeline, AI, etc.
│   └── lib/                   # Browser Supabase client and shared utilities
│
├── server/
│   ├── src/
│   │   ├── config/            # Environment validation and provider clients
│   │   ├── middleware/        # Authentication, validation, rate limits, errors
│   │   ├── modules/           # Profiles, leads, activities, AI, etc.
│   │   └── routes/            # API route registration
│   ├── dist/                  # Compiled backend output (generated)
│   └── .env.example           # Backend environment template
│
├── supabase/
│   └── migrations/            # PostgreSQL schema, triggers and RLS policies
│
├── docs/                      # Additional project notes, if present
├── .env.example               # Frontend environment template
├── package.json
└── README.md
```

`dist/` and `node_modules/` are generated/runtime directories. They
should not be treated as source code that must be committed.

------------------------------------------------------------------------

## Database design

The initial database migration is:

``` text
supabase/migrations/20261113000000_init.sql
```

It creates the application's enums, tables, indexes, triggers, helper
functions, grants, and Row Level Security policies.

  -----------------------------------------------------------------------
  Table                               Purpose
  ----------------------------------- -----------------------------------
  `profiles`                          User profile associated with an
                                      authentication user; includes the
                                      `admin` or `sales_rep` role

  `leads`                             Lead records, assignment, pipeline
                                      status, value, and tags

  `activities`                        Call, email, meeting, and note
                                      history associated with leads

  `follow_ups`                        Scheduled follow-up work

  `ai_insights`                       Append-only AI insight snapshots,
                                      including the provider label
  -----------------------------------------------------------------------

### Database behaviour

-   A signup trigger creates a `sales_rep` profile for a new user.
-   A guard trigger blocks self-promotion and role changes by
    non-administrators.
-   RLS policies control access to application tables.
-   Follow-up status is derived from `due_at` and `completed_at`.
-   AI insight records are stored as snapshots and do not directly
    modify lead records.

For exact column names, enum values, constraints, indexes, and policy
definitions, refer to the SQL migration rather than relying on this
summary.

------------------------------------------------------------------------

## Getting started

### Prerequisites

Install the following before running the application:

-   Node.js and npm (use a current Node.js LTS release compatible with
    the project dependencies).
-   Git.
-   A Supabase project.
-   A code editor such as Visual Studio Code.

Gemini and Resend credentials are optional for local startup, but are
needed to use their respective live integrations.

### 1. Clone the repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

Replace the placeholders with the actual repository URL and directory
name.

### 2. Configure the frontend

From the repository root:

``` bash
npm install
```

Create the frontend environment file.

**Windows PowerShell:**

``` powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

``` bash
cp .env.example .env
```

Add the frontend values described in the [Environment
variables](#environment-variables) section.

Start the frontend:

``` bash
npm run dev
```

The Vite development server normally runs at:

``` text
http://localhost:5173
```

### 3. Configure the database

Create a Supabase project and apply the migration described in [Database
setup](#database-setup).

### 4. Configure the backend

Open a second terminal:

``` bash
cd server
npm install
```

Create the backend environment file.

**Windows PowerShell:**

``` powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

``` bash
cp .env.example .env
```

Add the backend values described in the [Environment
variables](#environment-variables) section.

Start the backend in development mode:

``` bash
npm run dev
```

The API is expected to listen at:

``` text
http://localhost:3001/api
```

Keep both development servers running: one terminal for the frontend and
another for the backend.

### 5. Verify the backend

Open:

``` text
http://localhost:3001/api/health
```

The health endpoint should return a successful response when the backend
is running. It also reports provider configuration information; a
configured provider does not by itself prove that an external API call
will succeed.

------------------------------------------------------------------------

## Environment variables

Do not commit `.env` files. Use the example files as templates and
configure real values locally or in the hosting provider's environment
settings.

### Frontend: root `.env`

  Variable                   Description
  -------------------------- -----------------------------------------------
  `VITE_SUPABASE_URL`        Supabase project URL
  `VITE_SUPABASE_ANON_KEY`   Supabase public anon/publishable key
  `VITE_API_BASE_URL`        Base URL of the Express API, including `/api`

Local example:

``` env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-or-publishable-key>
VITE_API_BASE_URL=http://localhost:3001/api
```

Only values intended for browser exposure should use the `VITE_` prefix.
Never put a Gemini key, Resend key, database password, or Supabase
service-role key in a frontend variable.

### Backend: `server/.env`

  -----------------------------------------------------------------------
  Variable                Required                Description
  ----------------------- ----------------------- -----------------------
  `NODE_ENV`              No                      Runtime environment,
                                                  such as `development`
                                                  or `production`

  `PORT`                  No                      API port; local default
                                                  is `3001`

  `CLIENT_ORIGIN`         Yes for configured CORS Allowed frontend origin

  `SUPABASE_URL`          Yes                     Supabase project URL

  `SUPABASE_ANON_KEY`     Yes                     Public anon/publishable
                                                  key used with the
                                                  caller's JWT

  `GEMINI_API_KEY`        No                      Gemini API key; enables
                                                  live Gemini requests

  `GEMINI_MODEL`          No                      Gemini model name;
                                                  default in the supplied
                                                  implementation is
                                                  `gemini-2.5-flash`

  `RESEND_API_KEY`        No                      Resend API key for
                                                  optional email sending

  `RESEND_FROM_EMAIL`     No                      Verified sender address
                                                  used by Resend
  -----------------------------------------------------------------------

Example:

``` env
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://localhost:5173

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<public-anon-or-publishable-key>

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

The backend validates its environment at startup and fails fast if
required Supabase settings are missing or malformed.

------------------------------------------------------------------------

## Database setup

1.  Create a project in the Supabase dashboard.

2.  Open the project's SQL Editor.

3.  Open the migration file:

    ``` text
    supabase/migrations/20261113000000_init.sql
    ```

4.  Copy the migration SQL into a new SQL Editor query.

5.  Execute it against the intended project.

6.  Open the Table Editor and confirm that the expected tables were
    created.

7.  Review the migration for the created triggers, indexes, grants, and
    RLS policies.

The migration can also be applied with the Supabase CLI if the
repository is configured for that workflow.

**Important:** Apply migrations in the intended order and to the correct
Supabase project. Do not repeatedly run an initialization migration
against an already-initialized database unless the migration is designed
to be safely repeatable.

------------------------------------------------------------------------

## First administrator setup

New users receive the `sales_rep` role automatically. To promote the
first administrator, use the Supabase SQL Editor after the user has
signed up and their profile row exists.

``` sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'you@company.com';
```

Replace the email with the actual account email.

The SQL Editor is a privileged maintenance context and does not have the
same `auth.uid()` context as an application request. The migration's
role guard intentionally permits this controlled maintenance operation.
The application does not provide a self-service endpoint for role
escalation.

Only trusted project administrators should have access to the Supabase
SQL Editor.

------------------------------------------------------------------------

## Available scripts

### Frontend --- repository root

  -----------------------------------------------------------------------
  Command                             Description
  ----------------------------------- -----------------------------------
  `npm install`                       Install frontend dependencies

  `npm run dev`                       Start the Vite development server

  `npm run build`                     Run the TypeScript project build
                                      and create the production frontend
                                      bundle

  `npm run preview`                   Preview the production frontend
                                      build locally

  `npm run lint`                      Run Oxlint
  -----------------------------------------------------------------------

### Backend --- `server/`

Run these commands from the `server` directory.

  -----------------------------------------------------------------------
  Command                             Description
  ----------------------------------- -----------------------------------
  `npm install`                       Install backend dependencies

  `npm run dev`                       Start the API in watch/development
                                      mode using `tsx`

  `npm run build`                     Compile the backend into
                                      `server/dist`

  `npm start`                         Start the compiled backend

  `npm run typecheck`                 Run TypeScript checks without
                                      emitting build output

  `npm test`                          Run backend unit tests with Vitest
  -----------------------------------------------------------------------

For a production build, run the backend build from the `server`
directory before starting the compiled application.

------------------------------------------------------------------------

## API reference

The API base path is:

``` text
/api
```

All endpoints except `GET /api/health` require:

``` http
Authorization: Bearer <supabase-access-token>
```

### Response format

Successful responses use a consistent envelope:

``` json
{
  "success": true,
  "data": {},
  "message": "Request completed"
}
```

Error responses use:

``` json
{
  "success": false,
  "message": "A description of the error",
  "errors": [],
  "code": "OPTIONAL_ERROR_CODE"
}
```

Paginated endpoints may return:

``` json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 1
  }
}
```

### Health and profiles

  ---------------------------------------------------------------------------
  Method                  Endpoint                   Purpose / access
  ----------------------- -------------------------- ------------------------
  `GET`                   `/api/health`              Public health and
                                                     provider-configuration
                                                     status

  `GET`                   `/api/me`                  Get the current user's
                                                     profile

  `GET`                   `/api/profiles`            Get the team directory

  `PATCH`                 `/api/profiles/me`         Update the current
                                                     user's name or avatar

  `PATCH`                 `/api/profiles/:id/role`   Administrator-only role
                                                     update; cannot change
                                                     the caller's own role
  ---------------------------------------------------------------------------

### Leads

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose / access
  ----------------------- ----------------------- -----------------------
  `GET`                   `/api/leads`            List leads with search,
                                                  filters, sorting, and
                                                  pagination

  `POST`                  `/api/leads`            Create a lead

  `GET`                   `/api/leads/:id`        Get a lead detail,
                                                  subject to RLS

  `PATCH`                 `/api/leads/:id`        Update a lead

  `DELETE`                `/api/leads/:id`        Delete a lead; admin or
                                                  creator

  `POST`                  `/api/leads/import`     Administrator-only CSV
                                                  import

  `GET`                   `/api/leads/export`     Export leads to CSV
                                                  using supplied filters
  -----------------------------------------------------------------------

Lead list pagination is capped at 100 records per page.

### Activities

  -----------------------------------------------------------------------------
  Method                  Endpoint                      Purpose
  ----------------------- ----------------------------- -----------------------
  `GET`                   `/api/leads/:id/activities`   List a lead's activity
                                                        timeline

  `POST`                  `/api/leads/:id/activities`   Add an activity to a
                                                        lead

  `PATCH`                 `/api/activities/:id`         Update an activity

  `DELETE`                `/api/activities/:id`         Delete an activity
  -----------------------------------------------------------------------------

### Follow-ups

  --------------------------------------------------------------------------------
  Method                  Endpoint                         Purpose
  ----------------------- -------------------------------- -----------------------
  `GET`                   `/api/follow-ups`                List follow-ups

  `POST`                  `/api/follow-ups`                Create a follow-up

  `GET`                   `/api/follow-ups/:id`            Get follow-up details

  `PATCH`                 `/api/follow-ups/:id`            Update a follow-up

  `PATCH`                 `/api/follow-ups/:id/complete`   Mark a follow-up as
                                                           complete

  `DELETE`                `/api/follow-ups/:id`            Delete a follow-up
  --------------------------------------------------------------------------------

The list endpoint supports the `view` query parameter with `all`,
`upcoming`, `overdue`, or `completed`.

### Dashboard

  -------------------------------------------------------------------------------
  Method                  Endpoint                        Purpose
  ----------------------- ------------------------------- -----------------------
  `GET`                   `/api/dashboard/summary`        Dashboard KPIs, recent
                                                          activity, and upcoming
                                                          follow-ups

  `GET`                   `/api/dashboard/activity`       Six-month leads/revenue
                                                          activity series

  `GET`                   `/api/dashboard/lead-sources`   Lead-source
                                                          distribution

  `GET`                   `/api/dashboard/pipeline`       Pipeline counts and
                                                          values
  -------------------------------------------------------------------------------

### AI

  ---------------------------------------------------------------------------------
  Method                  Endpoint                          Purpose
  ----------------------- --------------------------------- -----------------------
  `GET`                   `/api/ai/status`                  AI configuration,
                                                            model, and mode

  `GET`                   `/api/ai/insights`                Latest insight per
                                                            accessible lead

  `GET`                   `/api/ai/leads/:id/insight`       Get the latest insight
                                                            for a lead

  `POST`                  `/api/ai/leads/:id/insight`       Generate and store a
                                                            lead insight snapshot

  `POST`                  `/api/ai/chat`                    Read-only CRM assistant

  `POST`                  `/api/ai/search`                  Convert
                                                            natural-language search
                                                            into allowlisted
                                                            filters

  `GET`                   `/api/ai/daily-summary`           Daily sales summary,
                                                            cached for five minutes
                                                            per user

  `POST`                  `/api/ai/leads/:id/email-draft`   Generate an email draft
                                                            without sending it

  `POST`                  `/api/ai/leads/:id/send-email`    Send an email through
                                                            Resend when configured
  ---------------------------------------------------------------------------------

For exact request bodies, query parameters, validation rules, and
response DTOs, consult the corresponding route and module implementation
in `server/src/`.

------------------------------------------------------------------------

## Authentication and security

Security controls described by the supplied implementation include:

-   Supabase Auth for user authentication.
-   Supabase access tokens sent to protected backend endpoints.
-   PostgreSQL Row Level Security on application tables.
-   Backend role and ownership checks in addition to RLS.
-   No Supabase service-role key used by the backend request flow.
-   Zod validation for request bodies, query parameters, and route
    parameters.
-   Pagination limits to reduce oversized list requests.
-   Helmet security headers.
-   CORS allowlisting.
-   General and stricter AI rate limits.
-   Centralized error handling with safe error responses.
-   Natural-language search translated into approved filter fields
    rather than arbitrary SQL.
-   AI output does not directly mutate CRM records.
-   Email sending is a separate explicit operation.

### Secret management

Never commit or publish:

-   `.env` files.
-   Gemini API keys.
-   Resend API keys.
-   Database passwords.
-   Supabase service-role keys.
-   Any other private credentials.

Keep local environment files ignored by Git. Configure production
secrets through the hosting provider's environment-variable settings.
The Supabase anon/publishable key is designed for browser use, but it
must always be paired with correctly configured RLS policies.

------------------------------------------------------------------------

## AI functionality

SignalDesk supports a Gemini provider and a mock/heuristic fallback.

### Gemini configuration

The backend reads:

``` env
GEMINI_API_KEY=<your-key>
GEMINI_MODEL=gemini-2.5-flash
```

The model setting can be changed to a model available to the configured
Google AI project. A configured key does not guarantee that the project
has permission, quota, or billing access for the selected model.

### Structured output and validation

AI responses are expected in structured JSON format and are validated
with Zod before being returned to the application. This reduces the risk
of malformed model output being treated as valid application data.

### Mock/heuristic mode

When a Gemini key is not configured, the implementation returns clearly
labelled mock/heuristic output:

``` json
{
  "provider": "mock",
  "model": "mock-heuristic"
}
```

The UI is intended to show a demo indicator and AI status message when
mock mode is active.

Mock output is not generated by Gemini. If mock mode is used in a demo
or submission, disclose that clearly in the README and video.

### AI safety and data handling

-   Lead context sent to the AI provider excludes email addresses and
    phone numbers.
-   AI-generated insights are stored as snapshots.
-   AI does not directly create, edit, or delete CRM records.
-   The CRM assistant is read-only.
-   Natural-language search is converted to allowlisted filters; it does
    not generate executable SQL.
-   Structured model output is validated before application use.

### Daily summary caching

Daily summaries are cached in memory for five minutes per user. This
cache is local to the running backend process and is cleared when that
process restarts.

------------------------------------------------------------------------

## Email functionality

Email sending is optional and uses Resend.

Configure both values in `server/.env` or the production backend
environment:

``` env
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=<verified-sender-address>
```

Email sending is enabled only when both values are present.

If Resend is not configured:

-   Email drafts remain available.
-   The send-email endpoint returns `503 EMAIL_NOT_CONFIGURED`.

When an email is successfully sent, the application records an activity.
The email-draft endpoint only creates a draft; it does not send the
message.

Use a sender address and domain verified with your email provider.

------------------------------------------------------------------------

## CSV import and export

### Import

CSV parsing and initial browser-side validation use PapaParse.

The documented required columns are:

-   `Name`
-   `Email`
-   `Company`

Optional columns are:

-   `Phone`
-   `Job Title`
-   `Source`
-   `Status`
-   `Priority`
-   `Deal Value`
-   `Notes`

The API validates rows individually. Duplicate emails within the
uploaded CSV and leads already present in the database are skipped and
reported. Invalid rows are not imported.

CSV import is administrator-only and limited to 500 rows per request.

### Export

The export endpoint returns a CSV download and respects the supplied
search, status, priority, and source filters.

------------------------------------------------------------------------

## Testing and verification

The supplied project README reports the following local verification:

  Check                                 Reported result
  ------------------------------------- -----------------
  Frontend production build             Passed
  Backend TypeScript build/type-check   Passed
  Backend unit tests                    26 passing
  `/api/health` smoke test              Passed
  Startup environment validation        Passed
  Live Supabase database/auth           Not verified
  Live Gemini API request               Not verified
  Live Resend email request             Not verified

Run the backend tests and type-check:

``` bash
cd server
npm test
npm run typecheck
```

Run the frontend production build from the repository root:

``` bash
npm run build
```

### Unit-test coverage reported

The backend unit tests cover:

-   Conversion-rate rounding.
-   Monthly activity buckets.
-   Derived follow-up status.
-   Email normalization and CSV escaping.
-   Zod schema validation.
-   Heuristic natural-language filters.
-   Mock insight safety.

These tests do not require live Supabase, Gemini, or Resend credentials.
They do not replace end-to-end testing or verification of database RLS
policies.

### Production smoke-test checklist

Before sharing a deployment with reviewers, verify the following using
the deployed URLs:

-   [ ] The frontend loads without browser-console errors.
-   [ ] Signup and login work.
-   [ ] Email confirmation and redirect URLs work if confirmation is
    enabled.
-   [ ] A signed-in user can create, view, update, and delete an
    authorized test lead.
-   [ ] Lead data persists after a page refresh.
-   [ ] Pipeline status changes persist.
-   [ ] Activities appear in the correct lead timeline.
-   [ ] Follow-ups can be created and completed.
-   [ ] Dashboard figures load from the deployed database.
-   [ ] AI status correctly identifies Gemini or mock mode.
-   [ ] AI requests return valid, provider-labelled responses.
-   [ ] CSV import and export behave as expected for an administrator.
-   [ ] RLS prevents users from accessing records they are not
    authorized to view.
-   [ ] No secret credentials are exposed in frontend assets or the
    public repository.

------------------------------------------------------------------------

## Deployment

The project can be deployed as two services:

-   **Frontend:** Vercel (Vite/React application).
-   **Backend:** Render (Node.js/Express API).
-   **Database and authentication:** Supabase.

### Deployment links

Replace these placeholders after successful deployment:

  Service                       URL
  ----------------------------- ----------------------------------
  Live application (frontend)   `ADD_YOUR_VERCEL_URL`
  Backend API                   `ADD_YOUR_RENDER_URL`
  GitHub repository             `ADD_YOUR_GITHUB_REPOSITORY_URL`

Do not submit placeholder URLs.

### Backend deployment on Render

Create a Render Web Service connected to the GitHub repository.

Expected settings when the backend package is located in `server/`:

  Setting          Value
  ---------------- --------------------------------
  Root Directory   `server`
  Runtime          Node
  Build Command    `npm install && npm run build`
  Start Command    `npm start`

The `server/package.json` must contain a `start` script that runs the
compiled server. The supplied scripts documentation identifies
`npm start` as the production start command.

Configure the backend environment variables in Render. At minimum,
provide the production Supabase URL, anon/publishable key, frontend
origin, and production port/runtime settings required by the host. Add
Gemini and Resend credentials only if those integrations are being used.

After deployment, test:

``` text
https://<your-render-service>.onrender.com/api/health
```

### Frontend deployment on Vercel

Import the GitHub repository into Vercel.

Expected Vite settings when the frontend is at the repository root:

  Setting            Value
  ------------------ -----------------
  Root Directory     `./`
  Build Command      `npm run build`
  Output Directory   `dist`
  Install Command    `npm install`

Set the frontend environment variables in Vercel:

``` env
VITE_SUPABASE_URL=<production-supabase-url>
VITE_SUPABASE_ANON_KEY=<public-anon-or-publishable-key>
VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api
```

If the application uses client-side routing, configure the hosting
provider to serve the SPA entry point for application routes.

### Production CORS and Supabase URLs

After obtaining the real frontend URL:

1.  Set the backend `CLIENT_ORIGIN` to the exact production frontend
    origin.
2.  Redeploy the backend if the environment variable changes.
3.  In Supabase Authentication URL Configuration, set the production
    Site URL.
4.  Add the production frontend and any required authentication callback
    paths to the allowed redirect URLs.
5.  Test signup, email confirmation, login, and password recovery on the
    deployed site.

Do not use a wildcard CORS origin for a production authenticated
application unless the implementation has a specific, reviewed reason to
do so.

------------------------------------------------------------------------

## Known limitations

The supplied implementation notes identify these limitations:

-   No automated end-to-end or live RLS integration suite was available
    in the reported environment.
-   Dashboard queries cap loaded records (5,000 leads and 2,000
    follow-ups) for in-process aggregation.
-   Daily-summary caching is per backend process and resets when the
    process restarts.
-   Notification preferences are stored locally in the browser.
-   No email scheduling worker or background follow-up scheduler is
    included.
-   The supplied repository notes did not include deployment
    configuration at the time they were written; deployment settings
    must be configured and verified separately.
-   Live Supabase, Gemini, and Resend operations were not verified in
    the reported local environment.

These limitations should be considered when evaluating the application
for production use.

------------------------------------------------------------------------

## Future improvements

Possible future improvements include:

-   Automated end-to-end tests for critical user journeys.
-   Automated integration tests for Supabase RLS and role boundaries.
-   Background jobs for scheduled reminders and notifications.
-   Persistent distributed caching for multi-instance deployments.
-   More detailed audit logging for sensitive administrative operations.
-   Expanded reporting and configurable sales analytics.
-   Production monitoring, structured logs, and error tracking.
-   Additional accessibility and performance testing.

------------------------------------------------------------------------
