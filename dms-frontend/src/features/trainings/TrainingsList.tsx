import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Filter, RotateCcw } from "lucide-react";
import { trainingService } from "@/services/trainingService";
import { lookupService } from "@/services/lookupService";
import LicenseDriverSelect from "@/components/common/LicenseDriverSelect";
import { RoleGuard } from "@/components/common/RoleGuard";
import PageHeader from "@/components/common/PageHeader";
import FilterDrawer from "@/components/common/FilterDrawer";
import AppTable from "@/components/common/AppTable";
import Pagination from "@/components/common/Pagination";
import AppModal from "@/components/common/AppModal";
import DeleteDialog from "@/components/common/DeleteDialog";
import StatusBadge from "@/components/common/StatusBadge";
import type { Training, TrainingSearchParams } from "@/types/training";
import type { ExpiryStatus, LookupItem } from "@/types/common";
import { format } from "date-fns";

export function TrainingsList() {
  const [items, setItems] = useState<Training[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<TrainingSearchParams>({ page: 1, pageSize: 10 });
  const [trainingTypes, setTrainingTypes] = useState<LookupItem[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Training | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<Training | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    lookupService.getTrainingTypes().then(setTrainingTypes).catch(console.error);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await trainingService.search(searchParams);
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch { toast.error("Failed to load training records"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [searchParams]);

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({ driverId: "", licenseId: "", trainingTypeId: "", dateCompleted: "", validUpto: "", trainerName: "" });
    setFormOpen(true);
  };

  const openEditForm = (item: Training) => {
    setEditingItem(item);
    setFormData({
      trainingTypeId: trainingTypes.find(t => t.name === item.trainingTypeName)?.id || "",
      dateCompleted: item.dateCompleted.split("T")[0],
      validUpto: item.validUpto.split("T")[0],
      trainerName: item.trainerName || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingItem) {
        await trainingService.update(editingItem.trainingId, { ...formData, trainingTypeId: Number(formData.trainingTypeId) });
        toast.success("Training record updated");
      } else {
        await trainingService.create({ ...formData, driverId: Number(formData.driverId), trainingTypeId: Number(formData.trainingTypeId) });
        toast.success("Training record created");
      }
      setFormOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Failed to save"); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteOpen) return;
    try {
      setDeleting(true);
      await trainingService.delete(deleteOpen.trainingId);
      toast.success("Training record deleted");
      setDeleteOpen(null);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Delete failed"); } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Records"
        description="Manage driver safety training completions, PEP talks, certifications and training expiry compliance."
        actions={
          <RoleGuard module="Trainings" action="create">
            <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500">
              <Plus size={18} /> Add Training
            </button>
          </RoleGuard>
        }
      />

      <div className="flex items-center gap-3 justify-end">
        <button onClick={() => setFilterDrawerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Filter size={16} /> Filter
          {(searchParams.status || searchParams.licenseNo) && <span className="ml-1 h-2 w-2 rounded-full bg-blue-600" />}
        </button>
        {(searchParams.status || searchParams.licenseNo) && (
          <button onClick={() => setSearchParams(p => ({ ...p, status: undefined, licenseNo: undefined, page: 1 }))} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      <AppTable
        loading={loading} data={items}
        emptyTitle="No training records found"
        emptyDescription="Record driver training completions to track compliance."
        columns={[
          { key: "driverName", header: "Driver Name", className: "font-semibold" },
          { key: "trainingTypeName", header: "Program / Training Type" },
          { key: "trainerName", header: "Trainer", render: (row) => row.trainerName || "-" },
          { key: "dateCompleted", header: "Completed On", render: (row) => format(new Date(row.dateCompleted), "dd MMM yyyy") },
          { key: "validUpto", header: "Valid Until", render: (row) => format(new Date(row.validUpto), "dd MMM yyyy") },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
          {
            key: "actions", header: "",
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <RoleGuard module="Trainings" action="update">
                  <button onClick={() => openEditForm(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"><PencilIcon /></button>
                </RoleGuard>
                <RoleGuard module="Trainings" action="delete">
                  <button onClick={() => setDeleteOpen(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"><TrashIcon /></button>
                </RoleGuard>
              </div>
            )
          },
        ]}
      />

      <Pagination currentPage={searchParams.page || 1} pageSize={searchParams.pageSize || 10} totalCount={totalCount} onPageChange={p => setSearchParams(prev => ({ ...prev, page: p }))} />

      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} title="Filter Training Records">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">License ID</label>
            <input type="text" placeholder="Search by License No" value={searchParams.licenseNo || ""}
              onChange={e => setSearchParams(p => ({ ...p, licenseNo: e.target.value || undefined, page: 1 }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Compliance Status</label>
            <select value={searchParams.status || ""} onChange={e => setSearchParams(p => ({ ...p, status: (e.target.value as ExpiryStatus) || undefined, page: 1 }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              <option value="">All Records</option>
              <option value="Valid">Valid</option>
              <option value="Expiring">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <button onClick={() => setFilterDrawerOpen(false)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white">Apply</button>
        </div>
      </FilterDrawer>

      <AppModal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingItem ? "Edit Training Record" : "Add Training Record"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingItem && (
            <LicenseDriverSelect
              value={formData.licenseId || ""}
              required
              onChange={(licenseId, license) => setFormData({ ...formData, licenseId, driverId: license?.driverId ?? "" })}
            />
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-500">Training Program *</label>
            <select required value={formData.trainingTypeId || ""} onChange={e => setFormData({ ...formData, trainingTypeId: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              <option value="">Select Program</option>
              {trainingTypes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Date Completed *</label>
              <input type="date" required value={formData.dateCompleted || ""} onChange={e => setFormData({ ...formData, dateCompleted: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Valid Upto *</label>
              <input type="date" required value={formData.validUpto || ""} onChange={e => setFormData({ ...formData, validUpto: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Trainer / Instructor Name</label>
            <input type="text" value={formData.trainerName || ""} onChange={e => setFormData({ ...formData, trainerName: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-350">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-blue-500">
              {editingItem ? "Save Changes" : "Add Training"}
            </button>
          </div>
        </form>
      </AppModal>

      <DeleteDialog isOpen={!!deleteOpen} onClose={() => setDeleteOpen(null)} onConfirm={handleDelete} loading={deleting}
        message={`Delete ${deleteOpen?.trainingTypeName} training record for ${deleteOpen?.driverName}?`} />
    </div>
  );
}

const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>;

export default TrainingsList;
