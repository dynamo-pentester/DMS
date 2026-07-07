import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchLicenses } from "../services/licenseService";
import { searchMedicalRecords } from "../services/medicalService";
import { searchTrainings } from "../services/trainingService";
import { searchPlantMovements } from "../services/plantMovementService";
import { searchNotifications } from "../services/notificationService";
import { RECORD_STATUS, NOTIFICATION_STATUS } from "../constants/statusTypes";

function StatCard({ label, value, to, tone = "default" }) {
  return (
    <Link to={to} className={`stat-card stat-${tone}`}>
      <div className="stat-value">{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
    </Link>
  );
}

export default function Dashboard() {
  const [counts, setCounts] = useState({
    expiringLicenses: null,
    expiringMedical: null,
    expiringTrainings: null,
    onSite: null,
    pendingNotifications: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [licenses, medical, trainings, movements, notifications] = await Promise.all([
        searchLicenses({ status: RECORD_STATUS.EXPIRING, page: 1, pageSize: 1 }),
        searchMedicalRecords({ status: RECORD_STATUS.EXPIRING, page: 1, pageSize: 1 }),
        searchTrainings({ status: RECORD_STATUS.EXPIRING, page: 1, pageSize: 1 }),
        searchPlantMovements({ onSiteOnly: true, page: 1, pageSize: 1 }),
        searchNotifications({ status: NOTIFICATION_STATUS.PENDING, page: 1, pageSize: 1 }),
      ]);

      if (cancelled) return;

      setCounts({
        expiringLicenses: licenses.data.totalCount,
        expiringMedical: medical.data.totalCount,
        expiringTrainings: trainings.data.totalCount,
        onSite: movements.data.totalCount,
        pendingNotifications: notifications.data.totalCount,
      });
    }

    load().catch((err) => console.error("Dashboard load failed", err));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <StatCard
          label="Expiring Licenses"
          value={counts.expiringLicenses}
          to="/licenses?status=Expiring"
          tone="warning"
        />
        <StatCard
          label="Expiring Medical Records"
          value={counts.expiringMedical}
          to="/medical-records?status=Expiring"
          tone="warning"
        />
        <StatCard
          label="Expiring Trainings"
          value={counts.expiringTrainings}
          to="/trainings?status=Expiring"
          tone="warning"
        />
        <StatCard
          label="Drivers On-Site"
          value={counts.onSite}
          to="/plant-movements?onSiteOnly=true"
          tone="info"
        />
        <StatCard
          label="Pending Notifications"
          value={counts.pendingNotifications}
          to="/notifications?status=Pending"
          tone="danger"
        />
      </div>
    </div>
  );
}
