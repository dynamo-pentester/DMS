import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createIncident } from "../services/incidentService";
import { useLookupStore } from "../store/userStore";

export default function IncidentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const incidentTypes = useLookupStore((s) => s.incidentTypes);
  const severityLevels = useLookupStore((s) => s.severityLevels);

  const [form, setForm] = useState({
    driverId: searchParams.get("driverId") || "",
    incidentDate: "",
    incidentTypeId: "",
    description: "",
    severityLevelId: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        driverId: Number(form.driverId),
        incidentTypeId: Number(form.incidentTypeId),
        severityLevelId: Number(form.severityLevelId),
      };
      const res = await createIncident(payload);
      navigate(`/incidents/${res.data.incidentId}`);
    } catch (err) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Report Incident</h1>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <label>
          Driver ID
          <input type="number" value={form.driverId} onChange={update("driverId")} required />
        </label>
        <label>
          Incident Date
          <input type="date" value={form.incidentDate} onChange={update("incidentDate")} required />
        </label>
        <label>
          Incident Type
          <select value={form.incidentTypeId} onChange={update("incidentTypeId")} required>
            <option value="">-- Select --</option>
            {incidentTypes.map((t) => (
              <option key={t.incidentTypeId} value={t.incidentTypeId}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Severity Level
          <select value={form.severityLevelId} onChange={update("severityLevelId")} required>
            <option value="">-- Select --</option>
            {severityLevels.map((s) => (
              <option key={s.severityLevelId} value={s.severityLevelId}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <input value={form.location} onChange={update("location")} />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={update("description")} required />
        </label>

        <div className="form-actions">
          <button className="btn-secondary" type="button" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
