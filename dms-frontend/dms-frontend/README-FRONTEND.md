# Driver Management System — Frontend

React 19 + Vite + TypeScript frontend for the `Driver.API` ASP.NET Core backend.

## Step 1–5 status (this delivery)

This delivery covers the **foundation**: folder structure, dependencies/config, routing,
layout, and authentication. Feature modules (Drivers, Licenses, Medical Records, etc.)
are wired into routing/navigation as placeholders and get built out module-by-module
in the following steps, per the original brief.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The dev server proxies `/api/*` to `https://localhost:5001` (see `vite.config.ts`).
Change `VITE_API_PROXY_TARGET` if your backend runs on a different port, or set
`VITE_API_BASE_URL` in `.env` to point directly at a deployed API origin.

## ⚠️ Backend changes you'll need

The backend has no CORS policy configured in `Program.cs`. The Vite dev proxy avoids
this locally, but for a production build served from a different origin than the API,
add a CORS policy to `Program.cs` (`AddCors` / `UseCors`) allowing the frontend's origin.

## Deviations from the original brief

The original brief listed generic fleet-management pages (Vehicles, Departments, Users,
Roles, Reports, Trips, Assignments). The actual `Driver.API` backend doesn't expose
those endpoints — the domain is a driver compliance/safety system. Pages here map 1:1
to what the backend actually supports:

| Brief said              | Backend has                        | Frontend page             |
|--------------------------|-------------------------------------|----------------------------|
| Drivers                  | `DriversController`                 | `/drivers`                |
| (n/a)                    | `LicensesController`                | `/licenses`                |
| (n/a)                    | `MedicalRecordsController`          | `/medical-records`         |
| (n/a)                    | `TrainingsController`               | `/trainings`               |
| (n/a)                    | `IncidentsController`               | `/incidents`               |
| Vehicles / Assignments   | `TransportersController` (incl. driver assignment history) | `/transporters` |
| Trips                    | `PlantMovementsController` (site entry/exit) | `/plant-movements` |
| (n/a)                    | `NotificationsController`           | `/notifications`           |
| Users / Roles            | *No API* — roles are fixed server-side (`RoleSeeder`) | not built |
| Departments              | *No API*                            | not built                  |
| Reports                  | *No dedicated API* — can be derived from search/list endpoints later | not built yet |

Roles (from `RoleSeeder.DefaultRoles`, hardcoded in `src/routes/navConfig.ts` and
`src/types/common.ts` — keep these in sync if the backend roles change):
`System Administrator`, `HR Executive`, `Safety Officer`, `Gate Security`,
`Transport Coordinator`, `Manager`.

## Known gaps (backend doesn't support these yet)

- **No refresh token endpoint.** Login issues a single JWT valid for 8 hours
  (`AuthController.BuildToken`). The axios interceptor logs the user out and redirects
  to `/login` on a 401 rather than attempting a silent refresh. Revisit
  `src/api/axiosInstance.ts` if a refresh endpoint is added.
- **Forgot password** (`src/features/auth/ForgotPasswordPage.tsx`) is UI-only — there's
  no `/api/auth/forgot-password` endpoint. It just shows the confirmation state.
- **Change password** (`src/features/settings/ChangePasswordPage.tsx`) is UI-only for
  the same reason — no endpoint exists.
- **Profile page** reads only what's in the JWT (name, email, roles) since there's no
  `GET /api/users/me`.

## Project structure

```
src/
  api/            axios instance, react-query client
  components/     shared/common + layout components
  contexts/       theme provider
  features/       one folder per domain module (auth, dashboard, drivers, ...)
  layouts/        AuthLayout, MainLayout
  pages/          standalone pages (404, 401, coming-soon)
  routes/         ProtectedRoute, nav config
  services/       one file per backend controller (authService, driverService, ...)
  store/          zustand stores (auth, ui)
  types/          TypeScript types mirroring the backend DTOs exactly
```

## Tech stack

React 19 · Vite · TypeScript · Tailwind CSS · Material UI · React Router DOM · Axios ·
React Hook Form + Zod · TanStack Query · Zustand · Framer Motion · React Hot Toast ·
Lucide React · Recharts
