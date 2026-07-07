# Driver Management System — Frontend

React + Vite + TypeScript frontend for the Driver.API backend (ASP.NET Core /
.NET 10, layered architecture: Driver.API / Driver.Application / Driver.Domain
/ Driver.Infrastructure).

Built module by module, matching each backend controller 1:1. See
`MODULES.md` for what's included so far and what's next.

## Stack
React 18 · Vite · TypeScript · MUI v6 · MUI X DataGrid/DatePickers ·
Redux Toolkit · React Router v6 · Axios · React Hook Form + Zod ·
React Toastify · Recharts

## Setup
```bash
npm install
cp .env.example .env    # point VITE_API_BASE_URL at your Driver.API, or leave
                         # unset to use the Vite dev proxy in vite.config.ts
npm run dev
```

The dev proxy forwards `/api/*` to `https://localhost:7160` (Driver.API's
default dev port) - change it in `vite.config.ts` if your API runs elsewhere.

## Folder structure
```
src/
  api/            axios client + JWT interceptor
  components/     shared UI: PageHeader, ServerDataGrid, StatusChip,
                  ConfirmDialog, EmptyState, LoadingState, route guards
  constants/      ROLES (mirrors RoleSeeder.DefaultRoles) and ROUTES
  features/       one folder per backend domain (auth, drivers, licenses, ...)
    <feature>/
      types.ts            mirrors the backend DTOs exactly
      <feature>Service.ts axios calls, one per controller action
      <feature>Slice.ts   RTK slice for list/detail state
      validation/         zod schemas for react-hook-form
      components/         feature-local components (forms, cards)
      pages/               route-level pages (List/Details/Form)
  layouts/        DashboardLayout, Sidebar, Navbar, nav config
  routes/         AppRoutes.tsx - central route table
  store/          Redux store + typed hooks
  theme/          design tokens, light/dark mode
  types/          cross-feature shared types (PagedResult, LookupItem)
  utils/          date formatting, API error normalization
```

## Known backend gaps this frontend has to work around
See the backend analysis report for full detail. In short:
1. `DriversController`/`TransportersController` Update/Delete/status/assignment
   endpoints throw `KeyNotFoundException` with **no catch block**, so a 404 you'd
   expect actually comes back as an unhandled 500 with no JSON body.
   `utils/errorUtils.ts` has a fallback message for this case.
2. No refresh-token endpoint - the JWT is stored with its 8-hour expiry and the
   axios 401 interceptor just logs the user out; there's nothing to refresh.
3. No Documents/file-upload controller exists yet despite being in the design
   doc's domain list, so there's no Documents module here.
4. Only `CreateDriverRequest` has server-side FluentValidation - the zod schemas
   in this frontend encode the same business rules (e.g. `ValidTill > IssueDate`)
   client-side for the other modules so users get instant feedback, but the
   backend will still reject bad data with a plain `{ error: "..." }` message.
