import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getTransporter,
  getAssignmentHistory,
  assignDriver,
  unassignDriver,
} from "../services/transporterService";
import DataTable from "../components/common/DataTable";
import { formatDate, toInputDate } from "../utils/dateFormat";

export default function TransporterDetails() {
  const { id } = useParams();
  const [transporter, setTransporter] = useState(null);
  const [history, setHistory] = useState([]);
  const [assignForm, setAssignForm] = useState({
    driverId: "",
    assignmentDate: toInputDate(new Date()),
  });
  const [error, setError] = useState("");

  const load = () => {
    getTransporter(id).then((res) => setTransporter(res.data));
    getAssignmentHistory(id).then((res) => setHistory(res.data));
  };

  useEffect(load, [id]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await assignDriver(id, {
        ...assignForm,
        driverId: Number(assignForm.driverId),
      });
      setAssignForm({ driverId: "", assignmentDate: toInputDate(new Date()) });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to assign driver.");
    }
  };

  const handleUnassign = async (driverId) => {
    await unassignDriver(id, driverId);
    load();
  };

  if (!transporter) return <div>Loading...</div>;

  const columns = [
    { key: "driverName", label: "Driver" },
    { key: "assignmentDate", label: "Assigned", render: (r) => formatDate(r.assignmentDate) },
    { key: "endDate", label: "Ended", render: (r) => (r.isCurrent ? "—" : formatDate(r.endDate)) },
    { key: "isCurrent", label: "Current", render: (r) => (r.isCurrent ? "Yes" : "No") },
    {
      key: "actions",
      label: "Actions",
      render: (r) =>
        r.isCurrent ? (
          <button className="btn-danger-sm" onClick={() => handleUnassign(r.driverId)}>
            Unassign
          </button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div>
      <h1>{transporter.name}</h1>
      <div className="driver-summary-grid">
        <div>
          <strong>Contact Person:</strong> {transporter.contactPerson || "—"}
        </div>
        <div>
          <strong>Mobile:</strong> {transporter.mobile}
        </div>
        <div>
          <strong>Address:</strong> {transporter.address || "—"}
        </div>
        <div>
          <strong>Agreement Valid Till:</strong> {formatDate(transporter.agreementValidTill)}
        </div>
        <div>
          <strong>Active:</strong> {transporter.isActive ? "Yes" : "No"}
        </div>
      </div>

      <h2>Driver Assignment History</h2>
      <DataTable columns={columns} rows={history.map((h, i) => ({ ...h, id: i }))} />

      <form className="entity-form" onSubmit={handleAssign}>
        <h3>Assign Driver</h3>
        {error && <div className="form-error">{error}</div>}
        <label>
          Driver ID
          <input
            type="number"
            value={assignForm.driverId}
            onChange={(e) => setAssignForm((f) => ({ ...f, driverId: e.target.value }))}
            required
          />
        </label>
        <label>
          Assignment Date
          <input
            type="date"
            value={assignForm.assignmentDate}
            onChange={(e) => setAssignForm((f) => ({ ...f, assignmentDate: e.target.value }))}
            required
          />
        </label>
        <div className="form-actions">
          <button className="btn-primary" type="submit">
            Assign
          </button>
        </div>
      </form>
    </div>
  );
}
