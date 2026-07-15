import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Plus, Filter, RotateCcw } from "lucide-react";
import { transporterService } from "@/services/transporterService";
import { RoleGuard } from "@/components/common/RoleGuard";
import PageHeader from "@/components/common/PageHeader";
import SearchBar from "@/components/common/SearchBar";
import FilterDrawer from "@/components/common/FilterDrawer";
import AppTable from "@/components/common/AppTable";
import Pagination from "@/components/common/Pagination";
import AppModal from "@/components/common/AppModal";
import DeleteDialog from "@/components/common/DeleteDialog";
import StatusBadge from "@/components/common/StatusBadge";
import TransporterForm from "./TransporterForm";
import TransporterDetails from "./TransporterDetails";
import type { Transporter, TransporterSearchParams } from "@/types/transporter";
import { format } from "date-fns";

export function TransportersList() {
  const [selectedTransporter, setSelectedTransporter] = useState<Transporter | null>(null);

  // Listing states
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<TransporterSearchParams>({
    page: 1,
    pageSize: 10,
    searchTerm: "",
    isActive: undefined,
  });

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Form modals state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState<Transporter | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState<Transporter | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounced search term input
  const [searchTermInput, setSearchTermInput] = useState("");

  const fetchTransporters = async () => {
    try {
      setLoading(true);
      const res = await transporterService.search(searchParams);
      setTransporters(res.items || []);
      setTotalCount(res.totalCount || 0);

      // Keep selected transporter synced
      if (selectedTransporter) {
        const found = res.items.find((x) => x.transporterId === selectedTransporter.transporterId);
        if (found) setSelectedTransporter(found);
      }
    } catch {
      toast.error("Failed to load transporters list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransporters();
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((p) => ({ ...p, page: 1, searchTerm: searchTermInput }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTermInput]);

  const handlePageChange = (page: number) => {
    setSearchParams((p) => ({ ...p, page }));
  };

  const handleFilterChange = (isActive?: boolean) => {
    setSearchParams((p) => ({ ...p, page: 1, isActive }));
  };

  const handleResetFilters = () => {
    setSearchTermInput("");
    setSearchParams({
      page: 1,
      pageSize: 10,
      searchTerm: "",
      isActive: undefined,
    });
  };

  // CRUD Actions
  const handleOpenCreateForm = () => {
    setEditingTransporter(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (item: Transporter) => {
    setEditingTransporter(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: any) => {
    try {
      setSubmitting(true);
      if (editingTransporter) {
        await transporterService.update(editingTransporter.transporterId, payload);
        toast.success("Transporter agency updated successfully");
      } else {
        await transporterService.create(payload);
        toast.success("Transporter agency registered successfully");
      }
      setFormOpen(false);
      fetchTransporters();
    } catch (err: any) {
      toast.error(err.message || "Failed to save transporter agency");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOpen) return;
    try {
      setDeleting(true);
      await transporterService.delete(deleteOpen.transporterId);
      toast.success("Transporter agency removed successfully");
      setDeleteOpen(null);
      if (selectedTransporter?.transporterId === deleteOpen.transporterId) {
        setSelectedTransporter(null);
      }
      fetchTransporters();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete transporter");
    } finally {
      setDeleting(false);
    }
  };

  if (selectedTransporter) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={selectedTransporter.name}
          description={`Transporter Agency Profile | Registered Contacts & Agreement`}
          actions={
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTransporter(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
              >
                Back to List
              </button>
              <RoleGuard module="Transporters" action="update">
                <button
                  onClick={() => handleOpenEditForm(selectedTransporter)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500"
                >
                  Edit Agency details
                </button>
              </RoleGuard>
            </div>
          }
        />
        <TransporterDetails transporter={selectedTransporter} onRefresh={fetchTransporters} />

        <AppModal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Edit Transporter Profile">
          <TransporterForm
            transporter={selectedTransporter}
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
        title="Transporters compliance"
        description="Verify transporter agency agreements, active contract validity, and manage active driver assignments."
        actions={
          <RoleGuard module="Transporters" action="create">
            <button
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500"
            >
              <Plus size={18} /> Add Transporter
            </button>
          </RoleGuard>
        }
      />

      {/* Control panel */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={searchTermInput} onChange={setSearchTermInput} placeholder="Search by agency name..." />

        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350"
        >
          <Filter size={16} /> Filters
          {searchParams.isActive !== undefined && (
            <span className="ml-1 h-2 w-2 rounded-full bg-blue-600" />
          )}
        </button>

        {(searchParams.isActive !== undefined || searchTermInput) && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      {/* Table grid */}
      <AppTable
        loading={loading}
        data={transporters}
        emptyTitle="No transporter agencies found"
        emptyDescription="Try modifying your keyword search or active status filters."
        columns={[
          { key: "name", header: "Transporter Agency Name", className: "font-semibold" },
          { key: "contactPerson", header: "Contact Person" },
          { key: "mobile", header: "Phone" },
          {
            key: "currentDriverCount",
            header: "Assigned Drivers",
            render: (row) => (
              <span className="font-semibold text-slate-750 dark:text-slate-250">
                {row.currentDriverCount} active
              </span>
            ),
          },
          {
            key: "agreementValidTill",
            header: "Agreement Valid Till",
            render: (row) =>
              row.agreementValidTill ? (
                <span>{format(new Date(row.agreementValidTill), "dd MMM yyyy")}</span>
              ) : (
                "-"
              ),
          },
          {
            key: "isActive",
            header: "Status",
            render: (row) => <StatusBadge status={row.isActive ? "Active" : "Inactive"} />,
          },
          {
            key: "actions",
            header: "",
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedTransporter(row)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-100 text-slate-700 dark:text-slate-350 dark:hover:bg-slate-800"
                >
                  View Details
                </button>

                <RoleGuard module="Transporters" action="update">
                  <button
                    onClick={() => handleOpenEditForm(row)}
                    className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"
                    title="Edit agency details"
                  >
                    <Plus size={15} className="rotate-45" />
                  </button>
                </RoleGuard>

                <RoleGuard module="Transporters" action="delete">
                  <button
                    onClick={() => setDeleteOpen(row)}
                    className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                    title="Remove agency contract"
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

      {/* Filters Drawer */}
      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} title="Filter Transporters">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Agency Status
            </label>
            <select
              value={searchParams.isActive === undefined ? "" : String(searchParams.isActive)}
              onChange={(e) =>
                handleFilterChange(
                  e.target.value === "" ? undefined : e.target.value === "true"
                )
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All statuses</option>
              <option value="true">Active Contracts</option>
              <option value="false">Inactive Contracts</option>
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

      {/* Create / Edit Form Modal */}
      <AppModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingTransporter ? "Edit Transporter details" : "Register Transporter agency"}
      >
        <TransporterForm
          transporter={editingTransporter}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
          loading={submitting}
        />
      </AppModal>

      {/* Delete Confirmation */}
      <DeleteDialog
        isOpen={!!deleteOpen}
        onClose={() => setDeleteOpen(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transporter Agency"
        message={`Are you sure you want to delete the registered contract of ${deleteOpen?.name}? This removes all current driver bindings and history logs.`}
        loading={deleting}
      />
    </div>
  );
}

// Reusable SVG fallback matching Driver list
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
export default TransportersList;
