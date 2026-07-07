import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/global.css";

import ProtectedRoute from "./components/common/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import BlankLayout from "./layouts/BlankLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Drivers from "./pages/Drivers";
import DriverForm from "./pages/DriverForm";
import DriverDetails from "./pages/DriverDetails";

import Licenses from "./pages/Licenses";
import LicenseForm from "./pages/LicenseForm";

import MedicalRecords from "./pages/MedicalRecords";
import MedicalRecordForm from "./pages/MedicalRecordForm";

import Training from "./pages/Training";
import TrainingForm from "./pages/TrainingForm";

import Incidents from "./pages/Incidents";
import IncidentForm from "./pages/IncidentForm";
import IncidentDetails from "./pages/IncidentDetails";

import PlantMovements from "./pages/PlantMovements";

import Transporters from "./pages/Transporters";
import TransporterDetails from "./pages/TransporterDetails";

import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BlankLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/drivers" element={<Drivers />} />
            <Route path="/drivers/new" element={<DriverForm />} />
            <Route path="/drivers/:id" element={<DriverDetails />} />
            <Route path="/drivers/:id/edit" element={<DriverForm />} />

            <Route path="/licenses" element={<Licenses />} />
            <Route path="/licenses/new" element={<LicenseForm />} />
            <Route path="/licenses/:id/edit" element={<LicenseForm />} />

            <Route path="/medical-records" element={<MedicalRecords />} />
            <Route path="/medical-records/new" element={<MedicalRecordForm />} />
            <Route path="/medical-records/:id/edit" element={<MedicalRecordForm />} />

            <Route path="/trainings" element={<Training />} />
            <Route path="/trainings/new" element={<TrainingForm />} />
            <Route path="/trainings/:id/edit" element={<TrainingForm />} />

            <Route path="/incidents" element={<Incidents />} />
            <Route path="/incidents/new" element={<IncidentForm />} />
            <Route path="/incidents/:id" element={<IncidentDetails />} />

            <Route path="/plant-movements" element={<PlantMovements />} />

            <Route path="/transporters" element={<Transporters />} />
            <Route path="/transporters/:id" element={<TransporterDetails />} />

            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
