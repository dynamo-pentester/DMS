import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDriver, deleteDriver, updateDriverStatus } from "../services/driverService";
import { searchLicenses } from "../services/licenseService";
import { searchMedicalRecords } from "../services/medicalService";
import { searchTrainings } from "../services/trainingService";
import { searchIncidents } from "../services/incidentService";
import { searchPlantMovements } from "../services/plantMovementService";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import ConfirmDialog from "../components/common/ConfirmDialog";
import RoleGuard from "../components/common/RoleGuard";
import { formatDate } from "../utils/dateFormat";
import { useLookupStore } from "../store/userStore";
import { ROLES, MODULE_PERMISSIONS } from "../constants/roles";

const TABS = ["Licenses", "Medical", "Training", "Incidents", "Movements"];

export default function DriverDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const driverStatusTypes = useLookupStore((s) => s.driverStatusTypes);

  const [driver, setDriver] = useState(null);
  const [activeTab, setActiveTab] = useState("Licenses");
  const [tabData, setTabData] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatusId, setNewStatusId] = useState("");
  const [statusReason, setStatusReason] = useState("");

  const loadDriver = () => getDriver(id).then((res) => setDriver(res.data));

  useEffect(() => {
    loadDriver();
  }, [id]);

  useEffect(() => {
    const driverId = Number(id);
    const loaders = {
      Licenses: () => searchLicenses({ driverId, pageSize: 50 }),
      Medical: () => searchMedicalRecords({ driverId, pageSize: 50 }),
      Training: () => searchTrainings({ driverId, pageSize: 50 }),
      Incidents: () => searchIncidents({ driverId, pageSize: 50 }),
      Movements: () => searchPlantMovements({ driverId, pageSize: 50 }),
    };
    loaders[activeTab]()
      .then((res) => setTabData((d) => ({ ...d, [activeTab]: res.data.items })))
      .catch((err) => console.error(err));
  }, [activeTab, id]);

  const handleDelete = async () => {
    await deleteDriver(id);
    navigate("/drivers");
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    await updateDriverStatus(id, {
      newStatusId: Number(newStatusId),
      reason: statusReason,
    });
    setStatusModal(false);
    setStatusReason("");
    loadDriver();
  };

  if (!driver) return <div>Loading...</div>;

  const tabColumns = {
    Licenses: [
      { key: "licenseNo", label: "License No" },
      { key: "vehicleTypeName", label: "Vehicle Type" },
      { key: "validTill", label: "Valid Till", render: (r) => formatDate(r.validTill) },
      { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    ],
    Medical: [
      { key: "examDate", label: "Exam Date", render: (r) => formatDate(r.examDate) },
      { key: "fitnessStatusName", label: "Fitness" },
      { key: "validTill", label: "Valid Till", render: (r) => formatDate(r.validTill) },
      { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    ],
    Training: [
      { key: "trainingTypeName", label: "Type" },
      { key: "dateCompleted", label: "Completed", render: (r) => formatDate(r.dateCompleted) },
      { key: "validUpto", label: "Valid Upto", render: (r) => formatDate(r.validUpto) },
      { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    ],
    Incidents: [
      { key: "incidentDate", label: "Date", render: (r) => formatDate(r.incidentDate) },
      { key: "incidentTypeName", label: "Type" },
      { key: "severityLevelName", label: "Severity" },
      {
        key: "rootCauseCompleted",
        label: "Root Cause Done",
        render: (r) => (r.rootCauseCompleted ? "Yes" : "No"),
      },
    ],
    Movements: [
      { key: "vehicleNo", label: "Vehicle No" },
      { key: "dateOfEntry", label: "Entry", render: (r) => formatDate(r.dateOfEntry) },
      { key: "dateOfExit", label: "Exit", render: (r) => formatDate(r.dateOfExit) },
      { key: "purposeTypeName", label: "Purpose" },
      { key: "isOnSite", label: "On Site", render: (r) => (r.isOnSite ? "Yes" : "No") },
    ],
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{driver.fullName}</h1>
          <p className="text-muted">
            {driver.driverCode} · {driver.mobile} · <StatusBadge status={driver.currentStatusName} />
          </p>
        </div>
        <div className="page-header-actions">
          <RoleGuard
            roles={[ROLES.SYSTEM_ADMINISTRATOR, ROLES.HR_EXECUTIVE, ROLES.SAFETY_OFFICER]}
          >
            <button className="btn-secondary" onClick={() => setStatusModal(true)}>
              Change Status
            </button>
          </RoleGuard>
          <RoleGuard roles={MODULE_PERMISSIONS.DRIVERS_WRITE}>
            <button className="btn-secondary" onClick={() => navigate(`/drivers/${id}/edit`)}>
              Edit
            </button>
          </RoleGuard>
          <RoleGuard roles={MODULE_PERMISSIONS.DRIVERS_DELETE}>
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          </RoleGuard>
        </div>
      </div>

      <div className="driver-summary-grid">
        <div>
          <strong>Father's Name:</strong> {driver.fatherName || "—"}
        </div>
        <div>
          <strong>DOB:</strong> {formatDate(driver.dateOfBirth)}
        </div>
        <div>
          <strong>Blood Group:</strong> {driver.bloodGroupName || "—"}
        </div>
        <div>
          <strong>Address:</strong> {driver.address || "—"}
        </div>
        <div>
          <strong>Aadhaar (last 4):</strong> {driver.aadhaarLast4 || "—"}
        </div>
        <div>
          <strong>Transporter:</strong> {driver.currentTransporterName || "—"}
        </div>
        <div>
          <strong>Emergency Contact:</strong> {driver.emergencyContactName || "—"} (
          {driver.emergencyContactRelation || "—"}) — {driver.emergencyContactPhone || "—"}
        </div>
        <div>
          <strong>Remarks:</strong> {driver.remarks || "—"}
        </div>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <DataTable
        columns={tabColumns[activeTab]}
        rows={(tabData[activeTab] || []).map((r, i) => ({ ...r, id: i }))}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Driver"
        message={`Are you sure you want to delete ${driver.fullName}? This is a soft delete.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {statusModal && (
        <div className="modal-overlay">
          <form className="modal-box" onSubmit={handleStatusChange}>
            <h3>Change Driver Status</h3>
            <label>
              New Status
              <select value={newStatusId} onChange={(e) => setNewStatusId(e.target.value)} required>
                <option value="">-- Select --</option>
                {driverStatusTypes.map((s) => (
                  <option key={s.driverStatusTypeId} value={s.driverStatusTypeId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setStatusModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" type="submit">
                Update
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
