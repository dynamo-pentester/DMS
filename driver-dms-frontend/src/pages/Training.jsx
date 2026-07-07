import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchTrainings, deleteTraining } from "../services/trainingService";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import StatusBadge from "../components/common/StatusBadge";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { formatDate } from "../utils/dateFormat";
import { RECORD_STATUS_OPTIONS } from "../constants/statusTypes";

export default function Training() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalCount: 0, pageSize: 25 });
  const [toDelete, setToDelete] = useState(null);

  const load = () => {
    searchTrainings({ status: status || undefined, page, pageSize: 25 })
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(load, [status, page]);

  const columns = [
    { key: "driverName", label: "Driver" },
    { key: "trainingTypeName", label: "Training Type" },
    { key: "dateCompleted", label: "Completed", render: (r) => formatDate(r.dateCompleted) },
    { key: "validUpto", label: "Valid Upto", render: (r) => formatDate(r.validUpto) },
    { key: "trainerName", label: "Trainer", render: (r) => r.trainerName || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          className="btn-danger-sm"
          onClick={(e) => {
            e.stopPropagation();
            setToDelete(r.trainingId);
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
        <h1>Trainings</h1>
        <button className="btn-primary" onClick={() => navigate("/trainings/new")}>
          + New Training
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
        rows={result.items.map((r) => ({ ...r, id: r.trainingId }))}
        onRowClick={(row) => navigate(`/trainings/${row.trainingId}/edit`)}
      />

      <Pagination
        page={page}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Training"
        message="Are you sure you want to delete this training record?"
        onConfirm={async () => {
          await deleteTraining(toDelete);
          setToDelete(null);
          load();
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
