import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchNotifications, dismissNotification } from "../services/notificationService";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import StatusBadge from "../components/common/StatusBadge";
import { formatDate } from "../utils/dateFormat";
import { NOTIFICATION_STATUS } from "../constants/statusTypes";

export default function Notifications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalCount: 0, pageSize: 25 });

  const load = () => {
    searchNotifications({ status: status || undefined, page, pageSize: 25 })
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(load, [status, page]);

  const handleDismiss = async (notificationId) => {
    await dismissNotification(notificationId);
    load();
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "message", label: "Message" },
    { key: "notificationEntityTypeName", label: "Related To" },
    { key: "dueDate", label: "Due Date", render: (r) => formatDate(r.dueDate) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (r) =>
        r.status === NOTIFICATION_STATUS.PENDING || r.status === NOTIFICATION_STATUS.SENT ? (
          <button className="btn-secondary" onClick={() => handleDismiss(r.notificationId)}>
            Dismiss
          </button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div>
      <h1>Notifications</h1>

      <div className="filter-row">
        <select
          value={status}
          onChange={(e) => {
            setSearchParams(e.target.value ? { status: e.target.value } : {});
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {Object.values(NOTIFICATION_STATUS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={result.items.map((r) => ({ ...r, id: r.notificationId }))}
        emptyMessage="No notifications."
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
