import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Filter } from "lucide-react";
import { plantMovementService } from "@/services/plantMovementService";
import { lookupService } from "@/services/lookupService";
import { RoleGuard } from "@/components/common/RoleGuard";
import PageHeader from "@/components/common/PageHeader";
import FilterDrawer from "@/components/common/FilterDrawer";
import AppTable from "@/components/common/AppTable";
import Pagination from "@/components/common/Pagination";
import AppModal from "@/components/common/AppModal";
import DeleteDialog from "@/components/common/DeleteDialog";
import StatusBadge from "@/components/common/StatusBadge";
import type { PlantMovement, PlantMovementSearchParams } from "@/types/plantMovement";
import type { LookupItem } from "@/types/common";
import { format } from "date-fns";

export function PlantMovementsList() {
  const [items, setItems] = useState<PlantMovement[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<PlantMovementSearchParams>({ page: 1, pageSize: 10 });
  const [plants, setPlants] = useState<LookupItem[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlantMovement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<PlantMovement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    lookupService.getPlants().then(setPlants).catch(console.error);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await plantMovementService.search(searchParams);
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch { toast.error("Failed to load plant movements"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [searchParams]);

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({ driverId: "", vehicleNo: "", transporterId: "", plantId: "", entryDateTime: "", exitDateTime: "", purpose: "", remarks: "" });
    setFormOpen(true);
  };

  const openEditForm = (item: PlantMovement) => {
    setEditingItem(item);
    setFormData({
      vehicleNo: item.vehicleNo || "",
      plantId: plants.find(p => p.name === item.plantName)?.id || "",
      entryDateTime: item.entryDateTime ? item.entryDateTime.slice(0, 16) : "",
      exitDateTime: item.exitDateTime ? item.exitDateTime.slice(0, 16) : "",
      purpose: item.purpose || "",
      remarks: item.remarks || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingItem) {
        await plantMovementService.update(editingItem.movementId, { ...formData, plantId: Number(formData.plantId) });
        toast.success("Movement record updated");
      } else {
        await plantMovementService.create({ ...formData, driverId: Number(formData.driverId), transporterId: formData.transporterId ? Number(formData.transporterId) : undefined, plantId: Number(formData.plantId) });
        toast.success("Movement record created");
      }
      setFormOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Failed to save"); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteOpen) return;
    try {
      setDeleting(true);
      await plantMovementService.delete(deleteOpen.movementId);
      toast.success("Movement record deleted");
      setDeleteOpen(null);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Delete failed"); } finally { setDeleting(false); }
  };

  const formatDateTime = (dt?: string) => dt ? format(new Date(dt), "dd MMM yyyy, HH:mm") : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Movements"
        description="Record and audit driver vehicle entries and exits at plant gates. Track purpose and duration of visits."
        actions={
          <RoleGuard module="PlantMovements" action="create">
            <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500">
              <Plus size={18} /> Log Movement
            </button>
          </RoleGuard>
        }
      />

      <div className="flex items-center justify-end gap-3">
        <button onClick={() => setFilterDrawerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Filter size={16} /> Filter
          {searchParams.plantId && <span className="ml-1 h-2 w-2 rounded-full bg-blue-600" />}
        </button>
      </div>

      <AppTable
        loading={loading} data={items}
        emptyTitle="No plant movements found"
        emptyDescription="Use the button above to log a driver vehicle entry or exit."
        columns={[
          { key: "driverName", header: "Driver", className: "font-semibold" },
          { key: "vehicleNo", header: "Vehicle No", render: (row) => <code className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono">{row.vehicleNo}</code> },
          { key: "plantName", header: "Plant" },
          { key: "transporterName", header: "Transporter", render: (row) => row.transporterName || "—" },
          { key: "entryDateTime", header: "Entry", render: (row) => formatDateTime(row.entryDateTime) },
          { key: "exitDateTime", header: "Exit", render: (row) => formatDateTime(row.exitDateTime) },
          {
            key: "status", header: "Status",
            render: (row) => <StatusBadge status={row.exitDateTime ? "Exited" : "Inside"} />
          },
          { key: "purpose", header: "Purpose", render: (row) => row.purpose || "—" },
          {
            key: "actions", header: "",
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <RoleGuard module="PlantMovements" action="update">
                  <button onClick={() => openEditForm(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"><PencilIcon /></button>
                </RoleGuard>
                <RoleGuard module="PlantMovements" action="delete">
                  <button onClick={() => setDeleteOpen(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"><TrashIcon /></button>
                </RoleGuard>
              </div>
            )
          },
        ]}
      />

      <Pagination currentPage={searchParams.page || 1} pageSize={searchParams.pageSize || 10} totalCount={totalCount} onPageChange={p => setSearchParams(prev => ({ ...prev, page: p }))} />

      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} title="Filter Plant Movements">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Plant</label>
            <select value={searchParams.plantId || ""} onChange={e => setSearchParams(p => ({ ...p, plantId: Number(e.target.value) || undefined, page: 1 }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              <option value="">All Plants</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={() => setFilterDrawerOpen(false)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white">Apply</button>
        </div>
      </FilterDrawer>

      <AppModal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingItem ? "Edit Movement Record" : "Log Plant Movement"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingItem && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500">Driver ID *</label>
                <input type="number" required value={formData.driverId || ""} onChange={e => setFormData({ ...formData, driverId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500">Transporter ID</label>
                <input type="number" value={formData.transporterId || ""} onChange={e => setFormData({ ...formData, transporterId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Vehicle No *</label>
              <input type="text" required value={formData.vehicleNo || ""} onChange={e => setFormData({ ...formData, vehicleNo: e.target.value })}
                placeholder="e.g. TN-01-AB-1234"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Plant *</label>
              <select required value={formData.plantId || ""} onChange={e => setFormData({ ...formData, plantId: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                <option value="">Select Plant</option>
                {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Entry Date/Time *</label>
              <input type="datetime-local" required value={formData.entryDateTime || ""} onChange={e => setFormData({ ...formData, entryDateTime: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Exit Date/Time</label>
              <input type="datetime-local" value={formData.exitDateTime || ""} onChange={e => setFormData({ ...formData, exitDateTime: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Purpose</label>
            <input type="text" value={formData.purpose || ""} onChange={e => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g. Material delivery"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Remarks</label>
            <textarea rows={2} value={formData.remarks || ""} onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {editingItem ? "Save Changes" : "Log Movement"}
            </button>
          </div>
        </form>
      </AppModal>

      <DeleteDialog isOpen={!!deleteOpen} onClose={() => setDeleteOpen(null)} onConfirm={handleDelete} loading={deleting}
        message={`Delete movement record for ${deleteOpen?.driverName} at ${deleteOpen?.plantName}?`} />
    </div>
  );
}

const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>;

export default PlantMovementsList;
