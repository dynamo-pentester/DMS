import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  searchTransporters,
  getTransporter,
  createTransporter,
  updateTransporter,
  assignDriver,
  unassignDriver,
  getAssignmentHistory,
} from "../services/transporterService";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import { useDebounce } from "../hooks/useDebounce";
import { formatDate, toInputDate } from "../utils/dateFormat";

export default function Transporters() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalCount: 0, pageSize: 25 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contactPerson: "", mobile: "", address: "", agreementValidTill: "" });
  const [error, setError] = useState("");

  const load = () => {
    searchTransporters({ searchTerm: debouncedSearch, page, pageSize: 25 })
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(load, [debouncedSearch, page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createTransporter(form);
      setShowForm(false);
      setForm({ name: "", contactPerson: "", mobile: "", address: "", agreementValidTill: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Save failed.");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "contactPerson", label: "Contact Person" },
    { key: "mobile", label: "Mobile" },
    { key: "agreementValidTill", label: "Agreement Valid Till", render: (r) => formatDate(r.agreementValidTill) },
    { key: "isActive", label: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Transporters</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New Transporter"}
        </button>
      </div>

      {showForm && (
        <form className="entity-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label>
            Contact Person
            <input
              value={form.contactPerson}
              onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
            />
          </label>
          <label>
            Mobile
            <input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} required />
          </label>
          <label>
            Address
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </label>
          <label>
            Agreement Valid Till
            <input
              type="date"
              value={form.agreementValidTill}
              onChange={(e) => setForm((f) => ({ ...f, agreementValidTill: e.target.value }))}
              required
            />
          </label>
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Save
            </button>
          </div>
        </form>
      )}

      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name..." />

      <DataTable
        columns={columns}
        rows={result.items.map((r) => ({ ...r, id: r.transporterId }))}
        onRowClick={(row) => navigate(`/transporters/${row.transporterId}`)}
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
