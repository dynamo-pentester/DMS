import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchPlantMovements, recordEntry, recordExit } from "../services/plantMovementService";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import { formatDate } from "../utils/dateFormat";
import { useLookupStore } from "../store/userStore";

export default function PlantMovements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const onSiteOnly = searchParams.get("onSiteOnly") === "true";
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalCount: 0, pageSize: 25 });
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryForm, setEntryForm] = useState({
    driverId: "",
    vehicleNo: "",
    purposeTypeId: "",
    gateNumberId: "",
  });
  const [error, setError] = useState("");

  const purposeTypes = useLookupStore((s) => s.purposeTypes);
  const gateNumbers = useLookupStore((s) => s.gateNumbers);

  const load = () => {
    searchPlantMovements({ onSiteOnly: onSiteOnly || undefined, page, pageSize: 25 })
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(load, [onSiteOnly, page]);

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await recordEntry({
        ...entryForm,
        driverId: Number(entryForm.driverId),
        purposeTypeId: Number(entryForm.purposeTypeId),
        gateNumberId: Number(entryForm.gateNumberId),
      });
      setShowEntryForm(false);
      setEntryForm({ driverId: "", vehicleNo: "", purposeTypeId: "", gateNumberId: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record entry.");
    }
  };

  const handleExit = async (movementId) => {
    await recordExit(movementId);
    load();
  };

  const columns = [
    { key: "driverName", label: "Driver" },
    { key: "vehicleNo", label: "Vehicle No" },
    { key: "dateOfEntry", label: "Entry", render: (r) => formatDate(r.dateOfEntry) },
    { key: "dateOfExit", label: "Exit", render: (r) => (r.isOnSite ? "—" : formatDate(r.dateOfExit)) },
    { key: "purposeTypeName", label: "Purpose" },
    { key: "gateNumberName", label: "Gate" },
    {
      key: "actions",
      label: "Actions",
      render: (r) =>
        r.isOnSite ? (
          <button className="btn-secondary" onClick={() => handleExit(r.movementId)}>
            Record Exit
          </button>
        ) : (
          <span className="text-muted">Exited</span>
        ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Plant Movements</h1>
        <button className="btn-primary" onClick={() => setShowEntryForm((v) => !v)}>
          {showEntryForm ? "Cancel" : "+ Record Entry"}
        </button>
      </div>

      {showEntryForm && (
        <form className="entity-form" onSubmit={handleEntrySubmit}>
          {error && <div className="form-error">{error}</div>}
          <label>
            Driver ID
            <input
              type="number"
              value={entryForm.driverId}
              onChange={(e) => setEntryForm((f) => ({ ...f, driverId: e.target.value }))}
              required
            />
          </label>
          <label>
            Vehicle No
            <input
              value={entryForm.vehicleNo}
              onChange={(e) => setEntryForm((f) => ({ ...f, vehicleNo: e.target.value }))}
              required
            />
          </label>
          <label>
            Purpose
            <select
              value={entryForm.purposeTypeId}
              onChange={(e) => setEntryForm((f) => ({ ...f, purposeTypeId: e.target.value }))}
              required
            >
              <option value="">-- Select --</option>
              {purposeTypes.map((p) => (
                <option key={p.purposeTypeId} value={p.purposeTypeId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Gate No
            <select
              value={entryForm.gateNumberId}
              onChange={(e) => setEntryForm((f) => ({ ...f, gateNumberId: e.target.value }))}
              required
            >
              <option value="">-- Select --</option>
              {gateNumbers.map((g) => (
                <option key={g.gateNumberId} value={g.gateNumberId}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Record Entry
            </button>
          </div>
        </form>
      )}

      <div className="filter-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={onSiteOnly}
            onChange={(e) => {
              setSearchParams(e.target.checked ? { onSiteOnly: "true" } : {});
              setPage(1);
            }}
          />
          On-site only
        </label>
      </div>

      <DataTable
        columns={columns}
        rows={result.items.map((r) => ({ ...r, id: r.movementId }))}
      />

      <Pagination
        page={page}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        onPageChange={setPage}
      />
    </div>
  );
}
