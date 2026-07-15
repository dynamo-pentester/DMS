import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Filter, RotateCcw } from "lucide-react";
import { licenseService } from "@/services/licenseService";
import { lookupService, type DriverLookupItem } from "@/services/lookupService";
import DriverSearchCombobox from "@/components/common/DriverSearchCombobox";
import { RoleGuard } from "@/components/common/RoleGuard";
import PageHeader from "@/components/common/PageHeader";
import SearchBar from "@/components/common/SearchBar";
import FilterDrawer from "@/components/common/FilterDrawer";
import AppTable from "@/components/common/AppTable";
import Pagination from "@/components/common/Pagination";
import AppModal from "@/components/common/AppModal";
import DeleteDialog from "@/components/common/DeleteDialog";
import StatusBadge from "@/components/common/StatusBadge";
import FileUpload from "@/components/common/FileUpload";
import InlineFileSelect from "@/components/common/InlineFileSelect";
import type { License, LicenseSearchParams, CreateLicenseRequest, UpdateLicenseRequest } from "@/types/license";
import type { ExpiryStatus } from "@/types/common";
import type { LookupItem } from "@/types/common";
import { format } from "date-fns";

export function LicensesList() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<LicenseSearchParams>({ page: 1, pageSize: 10 });

  const [vehicleTypes, setVehicleTypes] = useState<LookupItem[]>([]);
  const [endorsements, setEndorsements] = useState<LookupItem[]>([]);
  const [drivers, setDrivers] = useState<DriverLookupItem[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<License | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState<License | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTermInput, setSearchTermInput] = useState("");
  const [formData, setFormData] = useState<any>({});
  // Licence document selected inline during create - uploaded together with the
  // license record in a single request. Not used when editing (Replace still
  // happens via the compact FileUpload control in the table).
  const [licenceDocument, setLicenceDocument] = useState<File | null>(null);

  useEffect(() => {
    async function loadLookups() {
      try {
        const [vt, end, drv] = await Promise.all([
          lookupService.getVehicleTypes(),
          lookupService.getEndorsements(),
          lookupService.getDrivers(),
        ]);
        setVehicleTypes(vt);
        setEndorsements(end);
        setDrivers(drv);
      } catch (e) { console.error("Lookups error", e); }
    }
    loadLookups();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await licenseService.search(searchParams);
      setLicenses(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch { toast.error("Failed to load licenses"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setSearchParams(p => ({ ...p, page: 1 })), 400);
    return () => clearTimeout(t);
  }, [searchTermInput]);

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({ licenseNo: "", issueDate: "", validTill: "", vehicleTypeId: "", endorsementIds: [] });
    setLicenceDocument(null);
    setFormOpen(true);
  };

  const openEditForm = (item: License) => {
    setEditingItem(item);
    setFormData({
      licenseNo: item.licenseNo,
      issueDate: item.issueDate.split("T")[0],
      validTill: item.validTill.split("T")[0],
      vehicleTypeId: vehicleTypes.find(v => v.name === item.vehicleTypeName)?.id || "",
      endorsementIds: [],
    });
    setLicenceDocument(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingItem) {
        await licenseService.update(editingItem.licenseId, { ...formData, vehicleTypeId: Number(formData.vehicleTypeId), endorsementIds: formData.endorsementIds.map(Number) } as UpdateLicenseRequest);
        toast.success("License updated");
      } else {
        await licenseService.create({ ...formData, driverId: Number(formData.driverId), vehicleTypeId: Number(formData.vehicleTypeId), endorsementIds: formData.endorsementIds.map(Number) } as CreateLicenseRequest, licenceDocument);
        toast.success("License created");
      }
      setFormOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Failed to save license"); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteOpen) return;
    try {
      setDeleting(true);
      await licenseService.delete(deleteOpen.licenseId);
      toast.success("License deleted");
      setDeleteOpen(null);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Delete failed"); } finally { setDeleting(false); }
  };

  const toggleEndorsement = (id: number, checked: boolean) => {
    const list = [...(formData.endorsementIds || [])];
    if (checked) list.push(id); else { const i = list.indexOf(id); if (i > -1) list.splice(i, 1); }
    setFormData({ ...formData, endorsementIds: list });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Licenses"
        description="Manage and verify driver license validity, endorsements, and vehicle class approvals."
        actions={
          <RoleGuard module="Licenses" action="create">
            <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500">
              <Plus size={18} /> Add License
            </button>
          </RoleGuard>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={searchTermInput} onChange={setSearchTermInput} placeholder="Search by driver name..." />
        <button onClick={() => setFilterDrawerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Filter size={16} /> Filters
          {searchParams.status && <span className="ml-1 h-2 w-2 rounded-full bg-blue-600" />}
        </button>
        {searchParams.status && (
          <button onClick={() => setSearchParams(p => ({ ...p, status: undefined, page: 1 }))} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      <AppTable
        loading={loading}
        data={licenses}
        emptyTitle="No licenses found"
        emptyDescription="Add driver licenses or adjust your search filters."
        columns={[
          { key: "driverName", header: "Driver Name", className: "font-semibold" },
          { key: "licenseNo", header: "License No" },
          { key: "vehicleTypeName", header: "Vehicle Class" },
          {
            key: "endorsements", header: "Endorsements",
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.endorsements?.map((e: string) => (
                  <span key={e} className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">{e}</span>
                ))}
              </div>
            )
          },
          { key: "issueDate", header: "Issued", render: (row) => format(new Date(row.issueDate), "dd MMM yyyy") },
          { key: "validTill", header: "Expires", render: (row) => format(new Date(row.validTill), "dd MMM yyyy") },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
          {
            key: "document", header: "Document",
            render: (row) => (
              <FileUpload
                compact
                label="Licence Document"
                variant="document"
                hasFile={row.hasDocument}
                fileUrl={`/licenses/${row.licenseId}/document`}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onUpload={async (file) => {
                  await licenseService.uploadDocument(row.licenseId, file);
                  fetchData();
                }}
              />
            )
          },
          {
            key: "actions", header: "",
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <RoleGuard module="Licenses" action="update">
                  <button onClick={() => openEditForm(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500" title="Edit">
                    <PencilIcon />
                  </button>
                </RoleGuard>
                <RoleGuard module="Licenses" action="delete">
                  <button onClick={() => setDeleteOpen(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500" title="Delete">
                    <TrashIcon />
                  </button>
                </RoleGuard>
              </div>
            )
          },
        ]}
      />

      <Pagination currentPage={searchParams.page || 1} pageSize={searchParams.pageSize || 10} totalCount={totalCount} onPageChange={p => setSearchParams(prev => ({ ...prev, page: p }))} />

      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} title="Filter Licenses">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Expiry Status</label>
            <select value={searchParams.status || ""} onChange={e => setSearchParams(p => ({ ...p, status: (e.target.value as ExpiryStatus) || undefined, page: 1 }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              <option value="">All Statuses</option>
              <option value="Valid">Valid</option>
              <option value="Expiring">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <button onClick={() => setFilterDrawerOpen(false)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white">Apply Filters</button>
        </div>
      </FilterDrawer>

      <AppModal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingItem ? "Edit License" : "Add New License"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingItem && (
            <DriverSearchCombobox
              label="Driver"
              required
              items={drivers}
              value={formData.driverId ? Number(formData.driverId) : ""}
              onChange={(id) => setFormData({ ...formData, driverId: id })}
              placeholder="Search by name, code or license no..."
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500">License Number *</label>
              <input type="text" required value={formData.licenseNo || ""} onChange={e => setFormData({ ...formData, licenseNo: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Vehicle Type *</label>
              <select required value={formData.vehicleTypeId || ""} onChange={e => setFormData({ ...formData, vehicleTypeId: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                <option value="">Select Type</option>
                {vehicleTypes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Issue Date *</label>
              <input type="date" required value={formData.issueDate || ""} onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Valid Till *</label>
              <input type="date" required value={formData.validTill || ""} onChange={e => setFormData({ ...formData, validTill: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Endorsements</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl">
              {endorsements.map(x => (
                <label key={x.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={formData.endorsementIds?.includes(x.id)} onChange={e => toggleEndorsement(x.id, e.target.checked)} className="rounded" />
                  {x.name}
                </label>
              ))}
            </div>
          </div>
          {!editingItem && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Licence Document</label>
              <InlineFileSelect
                label="Licence Document"
                variant="document"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                allowedExtensions={[".pdf", ".jpg", ".jpeg", ".png", ".docx"]}
                maxSizeMb={10}
                hint="PDF, JPG, PNG, or DOCX, up to 10 MB"
                value={licenceDocument}
                onChange={setLicenceDocument}
                disabled={submitting}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500">
              {editingItem ? "Save Changes" : "Create License"}
            </button>
          </div>
        </form>
      </AppModal>

      <DeleteDialog isOpen={!!deleteOpen} onClose={() => setDeleteOpen(null)} onConfirm={handleDelete} loading={deleting}
        message={`Delete license ${deleteOpen?.licenseNo} for ${deleteOpen?.driverName}? This cannot be undone.`} />
    </div>
  );
}

const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>;

export default LicensesList;
