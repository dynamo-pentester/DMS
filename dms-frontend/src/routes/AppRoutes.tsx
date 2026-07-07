import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '@/features/auth/pages/LoginPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleRoute } from '@/components/RoleRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ROUTES } from '@/constants/routes';
import { MODULE_PERMISSIONS } from '@/config/rbac';

// Drivers
import DriversListPage from '@/features/drivers/pages/DriversListPage';
import DriverFormPage from '@/features/drivers/pages/DriverFormPage';
import DriverDetailsPage from '@/features/drivers/pages/DriverDetailsPage';

// Licenses
import LicensesListPage from '@/features/licenses/pages/LicensesListPage';
import LicenseFormPage from '@/features/licenses/pages/LicenseFormPage';

// Medical
import MedicalListPage from '@/features/medical/pages/MedicalListPage';
import MedicalFormPage from '@/features/medical/pages/MedicalFormPage';

// Trainings
import TrainingsListPage from '@/features/trainings/pages/TrainingsListPage';
import TrainingFormPage from '@/features/trainings/pages/TrainingFormPage';

// Incidents
import IncidentsListPage from '@/features/incidents/pages/IncidentsListPage';
import IncidentFormPage from '@/features/incidents/pages/IncidentFormPage';
import IncidentDetailsPage from '@/features/incidents/pages/IncidentDetailsPage';

// Plant Movements
import PlantMovementsListPage from '@/features/plant-movements/pages/PlantMovementsListPage';
import PlantMovementFormPage from '@/features/plant-movements/pages/PlantMovementFormPage';

// Transporters
import TransportersListPage from '@/features/transporters/pages/TransportersListPage';
import TransporterFormPage from '@/features/transporters/pages/TransporterFormPage';
import TransporterDetailsPage from '@/features/transporters/pages/TransporterDetailsPage';

// Notifications
import NotificationsListPage from '@/features/notifications/pages/NotificationsListPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.dashboard.read} />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          </Route>
          
          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.drivers.read} />}>
            <Route path={ROUTES.DRIVERS} element={<DriversListPage />} />
            <Route path={ROUTES.DRIVER_DETAILS()} element={<DriverDetailsPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.drivers.write} />}>
            <Route path={ROUTES.DRIVER_NEW} element={<DriverFormPage />} />
            <Route path={ROUTES.DRIVER_EDIT()} element={<DriverFormPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.licenses.read} />}>
            <Route path={ROUTES.LICENSES} element={<LicensesListPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.licenses.write} />}>
            <Route path={ROUTES.LICENSE_NEW} element={<LicenseFormPage />} />
            <Route path={ROUTES.LICENSE_EDIT()} element={<LicenseFormPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.medical.read} />}>
            <Route path={ROUTES.MEDICAL} element={<MedicalListPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.medical.write} />}>
            <Route path={ROUTES.MEDICAL_NEW} element={<MedicalFormPage />} />
            <Route path={ROUTES.MEDICAL_EDIT()} element={<MedicalFormPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.trainings.read} />}>
            <Route path={ROUTES.TRAININGS} element={<TrainingsListPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.trainings.write} />}>
            <Route path={ROUTES.TRAINING_NEW} element={<TrainingFormPage />} />
            <Route path={ROUTES.TRAINING_EDIT()} element={<TrainingFormPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.incidents.read} />}>
            <Route path={ROUTES.INCIDENTS} element={<IncidentsListPage />} />
            <Route path={ROUTES.INCIDENT_DETAILS()} element={<IncidentDetailsPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.incidents.write} />}>
            <Route path={ROUTES.INCIDENT_NEW} element={<IncidentFormPage />} />
            <Route path={ROUTES.INCIDENT_EDIT()} element={<IncidentFormPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.plantMovements.read} />}>
            <Route path={ROUTES.PLANT_MOVEMENTS} element={<PlantMovementsListPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.plantMovements.write} />}>
            <Route path={ROUTES.PLANT_MOVEMENT_NEW} element={<PlantMovementFormPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.transporters.read} />}>
            <Route path={ROUTES.TRANSPORTERS} element={<TransportersListPage />} />
            <Route path={ROUTES.TRANSPORTER_DETAILS()} element={<TransporterDetailsPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.transporters.write} />}>
            <Route path={ROUTES.TRANSPORTER_NEW} element={<TransporterFormPage />} />
            <Route path={ROUTES.TRANSPORTER_EDIT()} element={<TransporterFormPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={MODULE_PERMISSIONS.notifications.read} />}>
            <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsListPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
