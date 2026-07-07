import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getIncident, updateIncident, addCorrectiveAction } from "../services/incidentService";
import { useLookupStore } from "../store/userStore";
import { formatDate, toInputDate } from "../utils/dateFormat";

export default function IncidentDetails() {
  const { id } = useParams();
  const penaltyTypes = useLookupStore((s) => s.penaltyTypes);

  const [incident, setIncident] = useState(null);
  const [caForm, setCaForm] = useState({
    actionTaken: "",
    penaltyTypeId: "",
    actionDate: toInputDate(new Date()),
  });
  const [error, setError] = useState("");

  const load = () => getIncident(id).then((res) => setIncident(res.data));

  useEffect(load, [id]);

  const markRootCauseComplete = async () => {
    await updateIncident(id, {
      incidentDate: incident.incidentDate,
      incidentTypeId: incident.incidentTypeId ?? 0,
      description: incident.description,
      severityLevelId: incident.severityLevelId ?? 0,
      location: incident.location,
      rootCauseCompleted: true,
    });
    load();
  };

  const handleAddCorrectiveAction = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await addCorrectiveAction(id, {
        ...caForm,
        penaltyTypeId: caForm.penaltyTypeId ? Number(caForm.penaltyTypeId) : null,
      });
      setCaForm({ actionTaken: "", penaltyTypeId: "", actionDate: toInputDate(new Date()) });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add corrective action.");
    }
  };

  if (!incident) return <div>Loading...</div>;

  return (
    <div>
      <h1>Incident #{incident.incidentId}</h1>
      <div className="driver-summary-grid">
        <div>
          <strong>Driver:</strong> {incident.driverName}
        </div>
        <div>
          <strong>Date:</strong> {formatDate(incident.incidentDate)}
        </div>
        <div>
          <strong>Type:</strong> {incident.incidentTypeName}
        </div>
        <div>
          <strong>Severity:</strong> {incident.severityLevelName}
        </div>
        <div>
          <strong>Location:</strong> {incident.location || "—"}
        </div>
        <div>
          <strong>Root Cause Completed:</strong> {incident.rootCauseCompleted ? "Yes" : "No"}
        </div>
      </div>
      <p>{incident.description}</p>

      {!incident.rootCauseCompleted && (
        <button className="btn-secondary" onClick={markRootCauseComplete}>
          Mark Root Cause Analysis Complete
        </button>
      )}

      <h2>Corrective Actions</h2>
      {incident.correctiveActions.length === 0 ? (
        <p className="text-muted">No corrective actions recorded yet.</p>
      ) : (
        <ul className="corrective-action-list">
          {incident.correctiveActions.map((ca) => (
            <li key={ca.correctiveActionId}>
              <strong>{formatDate(ca.actionDate)}</strong> — {ca.actionTaken}
              {ca.penaltyTypeName ? ` (${ca.penaltyTypeName})` : ""}
            </li>
          ))}
        </ul>
      )}

      <form className="entity-form" onSubmit={handleAddCorrectiveAction}>
        <h3>Add Corrective Action</h3>
        {error && <div className="form-error">{error}</div>}
        <label>
          Action Taken
          <input
            value={caForm.actionTaken}
            onChange={(e) => setCaForm((f) => ({ ...f, actionTaken: e.target.value }))}
            required
          />
        </label>
        <label>
          Penalty Type
          <select
            value={caForm.penaltyTypeId}
            onChange={(e) => setCaForm((f) => ({ ...f, penaltyTypeId: e.target.value }))}
          >
            <option value="">-- None --</option>
            {penaltyTypes.map((p) => (
              <option key={p.penaltyTypeId} value={p.penaltyTypeId}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Action Date
          <input
            type="date"
            value={caForm.actionDate}
            onChange={(e) => setCaForm((f) => ({ ...f, actionDate: e.target.value }))}
          />
        </label>
        <div className="form-actions">
          <button className="btn-primary" type="submit">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
