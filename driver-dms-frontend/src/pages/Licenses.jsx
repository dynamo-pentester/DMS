import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchLicenses, deleteLicense } from "../services/licenseService";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import StatusBadge from "../components/common/StatusBadge";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { formatDate } from "../utils/dateFormat";
import { RECORD_STATUS_OPTIONS } from "../constants/statusTypes";

export default function Licenses() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalCount: 0, pageSize: 25 });
  const [toDelete, setToDelete] = useState(null);

  const load = () => {
    searchLicenses({ status: status || undefined, page, pageSize: 25 })
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(load, [status, page]);

  const columns = [
    { key: "driverName", label: "Driver" },
    { key: "licenseNo", label: "License No" },
    { key: "vehicleTypeName", label: "Vehicle Type" },
    { key: "issueDate", label: "Issue Date", render: (r) => formatDate(r.issueDate) },
    { key: "validTill", label: "Valid Till", render: (r) => formatDate(r.validTill) },
    { key: "endorsements", label: "Endorsements", render: (r) => r.endorsements.join(", ") || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          className="btn-danger-sm"
          onClick={(e) => {
            e.stopPropagation();
            setToDelete(r.licenseId);
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Licenses</h1>
        <button className="btn-primary" onClick={() => navigate("/licenses/new")}>
          + New License
        </button>
      </div>

      <div className="filter-row">
        <select
          value={status}
          onChange={(e) => {
            setSearchParams(e.target.value ? { status: e.target.value } : {});
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {RECORD_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={result.items.map((r) => ({ ...r, id: r.licenseId }))}
        onRowClick={(row) => navigate(`/licenses/${row.licenseId}/edit`)}
      />

      <Pagination
        page={page}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete License"
        message="Are you sure you want to delete this license record?"
        onConfirm={async () => {
          await deleteLicense(toDelete);
          setToDelete(null);
          load();
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
