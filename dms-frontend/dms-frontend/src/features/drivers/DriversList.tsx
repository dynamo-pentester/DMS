import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Plus, Filter, RotateCcw, ShieldCheck } from "lucide-react";
import { driverService } from "@/services/driverService";
import { lookupService } from "@/services/lookupService";
import { RoleGuard } from "@/components/common/RoleGuard";
import PageHeader from "@/components/common/PageHeader";
import SearchBar from "@/components/common/SearchBar";
import FilterDrawer from "@/components/common/FilterDrawer";
import AppTable from "@/components/common/AppTable";
import Pagination from "@/components/common/Pagination";
import AppModal from "@/components/common/AppModal";
import DeleteDialog from "@/components/common/DeleteDialog";
import StatusBadge from "@/components/common/StatusBadge";
import DriverForm from "./DriverForm";
import DriverStatusModal from "./DriverStatusModal";
import DriverDetails from "./DriverDetails";
import type { LookupItem } from "@/types/common";
import type { Driver, DriverSearchParams } from "@/types/driver";

export function DriversList() {
  // Selected driver for details drilldown
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Listing states
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<DriverSearchParams>({
    page: 1,
    pageSize: 10,
    searchTerm: "",
    statusId: undefined,
  });

  // Lookups cache
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Form modals state
  const [formOpen, setFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Status modification state
  const [statusModalOpen, setStatusModalOpen] = useState<Driver | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Deletion modal state
  const [deleteOpen, setDeleteOpen] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounced search term
  const [searchTermInput, setSearchTermInput] = useState("");

  // Load lookups
  useEffect(() => {
    async function loadLookups() {
      try {
        const list = await lookupService.getDriverStatusTypes();
        setStatuses(list);
      } catch (err) {
        console.error("Error loading statuses lookup:", err);
      }
    }
    loadLookups();
  }, []);

  // Fetch Drivers on search parameters changes
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await driverService.search(searchParams);
      setDrivers(res.items || []);
      setTotalCount(res.totalCount || 0);

      // Keep selected driver synced if details are open
      if (selectedDriverId) {
        const found = res.items.find((d) => d.driverId === selectedDriverId);
        if (found) {
          setSelectedDriver(found);
        } else {
          // fetch individual details if not in current page page-size
          try {
            const single = await driverService.getById(selectedDriverId);
            setSelectedDriver(single);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      toast.error("Failed to query drivers directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [searchParams]);

  // Debounce search term inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => ({ ...prev, page: 1, searchTerm: searchTermInput }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTermInput]);

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (statusId?: number) => {
    setSearchParams((prev) => ({ ...prev, page: 1, statusId }));
  };

  const handleResetFilters = () => {
    setSearchTermInput("");
    setSearchParams({
      page: 1,
      pageSize: 10,
      searchTerm: "",
      statusId: undefined,
    });
  };

  // CRUD Operations
  const handleOpenCreateForm = () => {
    setEditingDriver(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (driver: Driver) => {
    setEditingDriver(driver);
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: any) => {
    try {
      setSubmitting(true);
      if (editingDriver) {
        await driverService.update(editingDriver.driverId, payload);
        toast.success("Driver details updated successfully");
      } else {
        await driverService.create(payload);
        toast.success("Driver enrolled successfully");
      }
      setFormOpen(false);
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || "Failed to save driver details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChangeConfirm = async (statusId: number, reason: string) => {
    if (!statusModalOpen) return;
    try {
      setUpdatingStatus(true);
      await driverService.updateStatus(statusModalOpen.driverId, { newStatusId: statusId, reason });
      toast.success("Driver status updated successfully");
      setStatusModalOpen(null);
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update driver status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOpen) return;
    try {
      setDeleting(true);
      await driverService.delete(deleteOpen.driverId);
      toast.success("Driver compliance record removed");
      setDeleteOpen(null);
      if (selectedDriverId === deleteOpen.driverId) {
        setSelectedDriverId(null);
        setSelectedDriver(null);
      }
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete driver");
    } finally {
      setDeleting(false);
    }
  };

  // Switch back from drilldown details
  if (selectedDriver) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={selectedDriver.fullName}
          description={`Compliance Code: ${selectedDriver.driverCode} | Current Status: ${selectedDriver.currentStatusName}`}
          actions={
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedDriverId(null);
                  setSelectedDriver(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
              >
                Back to List
              </button>
              <RoleGuard module="Drivers" action="update">
                <button
                  onClick={() => handleOpenEditForm(selectedDriver)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-650"
                >
                  Edit Driver Details
                </button>
              </RoleGuard>
            </div>
          }
        />
        <DriverDetails driver={selectedDriver} onRefresh={fetchDrivers} />

        {/* Modal for edits within details panel */}
        <AppModal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          title="Edit Driver Details"
        >
          <DriverForm
            driver={selectedDriver}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
            loading={submitting}
          />
        </AppModal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers compliance"
        description="Verify driver status, license validity, medical checks, safety training log, and site plant movements."
        actions={
          <RoleGuard module="Drivers" action="create">
            <button
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-650"
            >
              <Plus size={18} /> Add Driver
            </button>
          </RoleGuard>
        }
      />

      {/* Control panel (Search & filters) */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={searchTermInput} onChange={setSearchTermInput} placeholder="Search by name or code..." />
        
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Filter size={16} /> Filters
          {searchParams.statusId && (
            <span className="ml-1 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />
          )}
        </button>

        {(searchParams.statusId || searchTermInput) && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      {/* Table grid */}
      <AppTable
        loading={loading}
        data={drivers}
        emptyTitle="No drivers found"
        emptyDescription="Try modifying your keyword search or filter selection."
        columns={[
          { key: "driverCode", header: "Driver Code", className: "font-semibold" },
          { key: "fullName", header: "Full Name" },
          { key: "mobile", header: "Mobile" },
          {
            key: "currentStatusName",
            header: "Status",
            render: (row) => <StatusBadge status={row.currentStatusName} />,
          },
          {
            key: "currentTransporterName",
            header: "Agency Transporter",
            render: (row) => row.currentTransporterName || <span className="text-slate-400">Unassigned</span>,
          },
          {
            key: "actions",
            header: "",
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedDriverId(row.driverId);
                    setSelectedDriver(row);
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  View Details
                </button>

                <RoleGuard module="Drivers" action="update">
                  <button
                    onClick={() => setStatusModalOpen(row)}
                    className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"
                    title="Change compliance status"
                  >
                    <ShieldCheck size={15} />
                  </button>
                </RoleGuard>

                <RoleGuard module="Drivers" action="update">
                  <button
                    onClick={() => handleOpenEditForm(row)}
                    className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"
                    title="Edit fields"
                  >
                    <Plus size={15} className="rotate-45" />
                  </button>
                </RoleGuard>

                <RoleGuard module="Drivers" action="delete">
                  <button
                    onClick={() => setDeleteOpen(row)}
                    className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                    title="Delete driver compliance file"
                  >
                    <Trash2 size={15} />
                  </button>
                </RoleGuard>
              </div>
            ),
          },
        ]}
      />

      {/* Pagination */}
      <Pagination
        currentPage={searchParams.page || 1}
        pageSize={searchParams.pageSize || 10}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />

      {/* Filter Drawer */}
      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} title="Filter Drivers">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Compliance Status
            </label>
            <select
              value={searchParams.statusId || ""}
              onChange={(e) => handleFilterChange(e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All Statuses</option>
              {statuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setFilterDrawerOpen(false)}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500"
          >
            Apply Filters
          </button>
        </div>
      </FilterDrawer>

      {/* Form Drawer / Modal Popup */}
      <AppModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingDriver ? "Edit Driver Profile" : "Enlist New Driver"}
      >
        <DriverForm
          driver={editingDriver}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
          loading={submitting}
        />
      </AppModal>

      {/* Status Modal Popup */}
      {statusModalOpen && (
        <DriverStatusModal
          isOpen={!!statusModalOpen}
          onClose={() => setStatusModalOpen(null)}
          driver={statusModalOpen}
          onConfirm={handleStatusChangeConfirm}
          loading={updatingStatus}
        />
      )}

      {/* Delete Dialog Popup */}
      <DeleteDialog
        isOpen={!!deleteOpen}
        onClose={() => setDeleteOpen(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Driver Profile"
        message={`Are you sure you want to permanently delete the compliance record of ${deleteOpen?.fullName}? This removes all history logs and credentials.`}
        loading={deleting}
      />
    </div>
  );
}

// Inline trash icon component fallback since Lucide trash2 is used
function Trash2({ size = 15, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  );
}
export default DriversList;
