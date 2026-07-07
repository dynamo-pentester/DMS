import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchIncidents } from "../services/incidentService";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import { formatDate } from "../utils/dateFormat";

export default function Incidents() {
  const navigate = useNavigate();
  const [rootCauseFilter, setRootCauseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalCount: 0, pageSize: 25 });

  useEffect(() => {
    searchIncidents({
      rootCauseCompleted: rootCauseFilter === "" ? undefined : rootCauseFilter === "true",
      page,
      pageSize: 25,
    })
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err));
  }, [rootCauseFilter, page]);

  const columns = [
    { key: "driverName", label: "Driver" },
    { key: "incidentDate", label: "Date", render: (r) => formatDate(r.incidentDate) },
    { key: "incidentTypeName", label: "Type" },
    { key: "severityLevelName", label: "Severity" },
    { key: "location", label: "Location", render: (r) => r.location || "—" },
    {
      key: "rootCauseCompleted",
      label: "Root Cause Done",
      render: (r) => (r.rootCauseCompleted ? "Yes" : "No"),
    },
    { key: "correctiveActions", label: "Corrective Actions", render: (r) => r.correctiveActions.length },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Incidents</h1>
        <button className="btn-primary" onClick={() => navigate("/incidents/new")}>
          + Report Incident
        </button>
      </div>

      <div className="filter-row">
        <select
          value={rootCauseFilter}
          onChange={(e) => {
            setRootCauseFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="false">Root Cause Pending</option>
          <option value="true">Root Cause Completed</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={result.items.map((r) => ({ ...r, id: r.incidentId }))}
        onRowClick={(row) => navigate(`/incidents/${row.incidentId}`)}
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
