import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppThemeProvider } from "@/contexts/ThemeProvider";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";

import { LoginPage } from "@/features/auth/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ProfilePage } from "@/features/settings/ProfilePage";
import { ChangePasswordPage } from "@/features/settings/ChangePasswordPage";

import { NotFoundPage } from "@/pages/NotFoundPage";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";

import DriversPage from "@/pages/DriversPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import TransportersPage from "@/pages/TransportersPage";
import LicensesPage from "@/pages/LicensesPage";
import MedicalPage from "@/pages/MedicalPage";
import TrainingsPage from "@/pages/TrainingsPage";
import IncidentsPage from "@/pages/IncidentsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ReportsPage from "@/pages/ReportsPage";
import UsersPage from "@/pages/UsersPage";

/**
 * InnerAuthenticatedRoutes — renders only after auth check passes.
 * PermissionProvider is mounted here so Sidebar and all child components
 * can call usePermissions() safely.
 */
function AuthenticatedRoutes() {
  return (
    <PermissionProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* All modules — ProtectedRoute children guard checks canAccessModule */}
          <Route path="/drivers"         element={<ProtectedRoute module="Drivers"><DriversPage /></ProtectedRoute>} />
          <Route path="/approvals"       element={<ProtectedRoute module="Approvals"><ApprovalsPage /></ProtectedRoute>} />
          <Route path="/transporters"    element={<ProtectedRoute module="Transporters"><TransportersPage /></ProtectedRoute>} />
          <Route path="/licenses"        element={<ProtectedRoute module="Licenses"><LicensesPage /></ProtectedRoute>} />
          <Route path="/medical-records" element={<ProtectedRoute module="MedicalRecords"><MedicalPage /></ProtectedRoute>} />
          <Route path="/trainings"       element={<ProtectedRoute module="Trainings"><TrainingsPage /></ProtectedRoute>} />
          <Route path="/incidents"       element={<ProtectedRoute module="Incidents"><IncidentsPage /></ProtectedRoute>} />
          <Route path="/reports"         element={<ProtectedRoute module="Reports"><ReportsPage /></ProtectedRoute>} />
          <Route path="/users"           element={<ProtectedRoute module="Users"><UsersPage /></ProtectedRoute>} />

          {/* Unrestricted authenticated pages */}
          <Route path="/notifications"   element={<NotificationsPage />} />
          <Route path="/profile"         element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Route>
      </Routes>
    </PermissionProvider>
  );
}

export default function App() {
  return (
    <AppThemeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              "!rounded-xl !bg-white !text-sm !text-slate-800 !shadow-soft-lg dark:!bg-slate-800 dark:!text-slate-100",
            success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
          }}
        />

        <Routes>
          {/* Public auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Authenticated shell — auth guard at the outer level */}
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AuthenticatedRoutes />} />
          </Route>

          {/* Error pages */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*"             element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
  );
}
