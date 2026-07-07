import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchMedicalRecords, deleteMedicalRecord } from "../services/medicalService";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import StatusBadge from "../components/common/StatusBadge";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { formatDate } from "../utils/dateFormat";
import { RECORD_STATUS_OPTIONS } from "../constants/statusTypes";

export default function MedicalRecords() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalCount: 0, pageSize: 25 });
  const [toDelete, setToDelete] = useState(null);

  const load = () => {
    searchMedicalRecords({ status: status || undefined, page, pageSize: 25 })
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(load, [status, page]);

  const columns = [
    { key: "driverName", label: "Driver" },
    { key: "examDate", label: "Exam Date", render: (r) => formatDate(r.examDate) },
    { key: "fitnessStatusName", label: "Fitness" },
    { key: "bp", label: "BP", render: (r) => r.bp || "—" },
    { key: "validTill", label: "Valid Till", render: (r) => formatDate(r.validTill) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          className="btn-danger-sm"
          onClick={(e) => {
            e.stopPropagation();
            setToDelete(r.medicalRecordId);
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
        <h1>Medical Records</h1>
        <button className="btn-primary" onClick={() => navigate("/medical-records/new")}>
          + New Record
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
        rows={result.items.map((r) => ({ ...r, id: r.medicalRecordId }))}
        onRowClick={(row) => navigate(`/medical-records/${row.medicalRecordId}/edit`)}
      />

      <Pagination
        page={page}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Medical Record"
        message="Are you sure you want to delete this medical record?"
        onConfirm={async () => {
          await deleteMedicalRecord(toDelete);
          setToDelete(null);
          load();
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
