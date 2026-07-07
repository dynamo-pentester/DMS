import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchDrivers } from "../services/driverService";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import RoleGuard from "../components/common/RoleGuard";
import { useDebounce } from "../hooks/useDebounce";
import { MODULE_PERMISSIONS } from "../constants/roles";

export default function Drivers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalCount: 0, pageSize: 25 });

  useEffect(() => {
    searchDrivers({ searchTerm: debouncedSearch, page, pageSize: 25 })
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err));
  }, [debouncedSearch, page]);

  const columns = [
    { key: "driverCode", label: "Driver Code" },
    { key: "fullName", label: "Full Name" },
    { key: "mobile", label: "Mobile" },
    { key: "currentStatusName", label: "Status" },
    { key: "currentTransporterName", label: "Transporter" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Drivers</h1>
        <RoleGuard roles={MODULE_PERMISSIONS.DRIVERS_WRITE}>
          <button className="btn-primary" onClick={() => navigate("/drivers/new")}>
            + New Driver
          </button>
        </RoleGuard>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search by code, name, or mobile..."
      />

      <DataTable
        columns={columns}
        rows={result.items.map((d) => ({ ...d, id: d.driverId }))}
        onRowClick={(row) => navigate(`/drivers/${row.driverId}`)}
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
