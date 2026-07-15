import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Filter, RotateCcw } from "lucide-react";
import { medicalService } from "@/services/medicalService";
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
import FileUpload from "@/components/common/FileUpload";
import InlineFileSelect from "@/components/common/InlineFileSelect";
import type { MedicalRecord, MedicalRecordSearchParams } from "@/types/medicalRecord";
import type { ExpiryStatus, LookupItem } from "@/types/common";
import { format } from "date-fns";

export function MedicalList() {
  const [items, setItems] = useState<MedicalRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<MedicalRecordSearchParams>({ page: 1, pageSize: 10 });
  const [fitnessStatuses, setFitnessStatuses] = useState<LookupItem[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicalRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<MedicalRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<any>({});
  // Certificate selected inline during create - uploaded together with the
  // record in a single request. Not used when editing (Replace still happens
  // via the compact FileUpload control in the table).
  const [certificate, setCertificate] = useState<File | null>(null);

  useEffect(() => {
    lookupService.getFitnessStatuses().then(setFitnessStatuses).catch(console.error);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await medicalService.search(searchParams);
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch { toast.error("Failed to load medical records"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [searchParams]);

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({ driverId: "", licenseId: "", examDate: "", fitnessStatusId: "", bp: "", visionTestPass: true, alcoholTestPass: true, chronicIllness: false, chronicIllnessRemarks: "", validTill: "" });
    setCertificate(null);
    setFormOpen(true);
  };

  const openEditForm = (item: MedicalRecord) => {
    setEditingItem(item);
    setFormData({
      examDate: item.examDate.split("T")[0],
      fitnessStatusId: fitnessStatuses.find(f => f.name === item.fitnessStatusName)?.id || "",
      bp: item.bp || "",
      visionTestPass: item.visionTestPass,
      alcoholTestPass: item.alcoholTestPass,
      chronicIllness: item.chronicIllness,
      chronicIllnessRemarks: item.chronicIllnessRemarks || "",
      validTill: item.validTill.split("T")[0],
    });
    setCertificate(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingItem) {
        await medicalService.update(editingItem.medicalRecordId, { ...formData, fitnessStatusId: Number(formData.fitnessStatusId) });
        toast.success("Medical record updated");
      } else {
        await medicalService.create({ ...formData, driverId: Number(formData.driverId), fitnessStatusId: Number(formData.fitnessStatusId) }, certificate);
        toast.success("Medical record added");
      }
      setFormOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Failed to save"); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteOpen) return;
    try {
      setDeleting(true);
      await medicalService.delete(deleteOpen.medicalRecordId);
      toast.success("Medical record deleted");
      setDeleteOpen(null);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Delete failed"); } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Exams"
        description="Track driver fitness examinations, health status compliance, and medical certification expiry dates."
        actions={
          <RoleGuard module="MedicalRecords" action="create">
            <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500">
              <Plus size={18} /> Add Record
            </button>
          </RoleGuard>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1" />
        <button onClick={() => setFilterDrawerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Filter size={16} /> Filters
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
        emptyTitle="No medical records found"
        emptyDescription="Add driver medical records or adjust filters."
        columns={[
          { key: "driverName", header: "Driver Name", className: "font-semibold" },
          { key: "examDate", header: "Exam Date", render: (row) => format(new Date(row.examDate), "dd MMM yyyy") },
          { key: "fitnessStatusName", header: "Fitness Level" },
          { key: "bp", header: "BP Reading", render: (row) => row.bp || "-" },
          { key: "visionTestPass", header: "Vision", render: (row) => <StatusBadge status={row.visionTestPass ? "Pass" : "Failed"} /> },
          { key: "alcoholTestPass", header: "Alcohol", render: (row) => <StatusBadge status={row.alcoholTestPass ? "Pass" : "Failed"} /> },
          { key: "validTill", header: "Valid Till", render: (row) => format(new Date(row.validTill), "dd MMM yyyy") },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
          {
            key: "certificate", header: "Certificate",
            render: (row) => (
              <FileUpload
                compact
                label="Medical Certificate"
                variant="document"
                hasFile={row.hasCertificate}
                fileUrl={`/medical-records/${row.medicalRecordId}/certificate`}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onUpload={async (file) => {
                  await medicalService.uploadCertificate(row.medicalRecordId, file);
                  fetchData();
                }}
              />
            )
          },
          {
            key: "actions", header: "",
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <RoleGuard module="MedicalRecords" action="update">
                  <button onClick={() => openEditForm(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500">
                    <PencilIcon />
                  </button>
                </RoleGuard>
                <RoleGuard module="MedicalRecords" action="delete">
                  <button onClick={() => setDeleteOpen(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500">
                    <TrashIcon />
                  </button>
                </RoleGuard>
              </div>
            )
          },
        ]}
      />

      <Pagination currentPage={searchParams.page || 1} pageSize={searchParams.pageSize || 10} totalCount={totalCount} onPageChange={p => setSearchParams(prev => ({ ...prev, page: p }))} />

      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} title="Filter Medical Records">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">License ID</label>
            <input type="text" placeholder="Search by License No" value={searchParams.licenseNo || ""}
              onChange={e => setSearchParams(p => ({ ...p, licenseNo: e.target.value || undefined, page: 1 }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Fitness Status</label>
            <select value={searchParams.status || ""} onChange={e => setSearchParams(p => ({ ...p, status: (e.target.value as ExpiryStatus) || undefined, page: 1 }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              <option value="">All Records</option>
              <option value="Valid">Valid</option>
              <option value="Expiring">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <button onClick={() => setFilterDrawerOpen(false)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white">Apply Filters</button>
        </div>
      </FilterDrawer>

      <AppModal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingItem ? "Edit Medical Record" : "Add Medical Record"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingItem && (
            <LicenseDriverSelect
              value={formData.licenseId || ""}
              required
              onChange={(licenseId, license) => setFormData({ ...formData, licenseId, driverId: license?.driverId ?? "" })}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Exam Date *</label>
              <input type="date" required value={formData.examDate || ""} onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Fitness Status *</label>
              <select required value={formData.fitnessStatusId || ""} onChange={e => setFormData({ ...formData, fitnessStatusId: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                <option value="">Select</option>
                {fitnessStatuses.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Blood Pressure</label>
              <input type="text" placeholder="e.g. 120/80" value={formData.bp || ""} onChange={e => setFormData({ ...formData, bp: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Valid Till *</label>
              <input type="date" required value={formData.validTill || ""} onChange={e => setFormData({ ...formData, validTill: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 py-2 border-y border-slate-100 dark:border-slate-800">
            {[["visionTestPass", "Vision Test Pass"], ["alcoholTestPass", "Alcohol Screen Pass"], ["chronicIllness", "Chronic Illness"]].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input type="checkbox" checked={formData[key] || false} onChange={e => setFormData({ ...formData, [key]: e.target.checked })} className="rounded" />
                {label}
              </label>
            ))}
          </div>
          {formData.chronicIllness && (
            <div>
              <label className="block text-xs font-semibold text-slate-500">Illness Remarks</label>
              <textarea rows={2} value={formData.chronicIllnessRemarks || ""} onChange={e => setFormData({ ...formData, chronicIllnessRemarks: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
          )}
          {!editingItem && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Medical Certificate</label>
              <InlineFileSelect
                label="Medical Certificate"
                variant="document"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                allowedExtensions={[".pdf", ".jpg", ".jpeg", ".png", ".docx"]}
                maxSizeMb={10}
                hint="PDF, JPG, PNG, or DOCX, up to 10 MB"
                value={certificate}
                onChange={setCertificate}
                disabled={submitting}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-350">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-blue-500">
              {editingItem ? "Save Changes" : "Add Record"}
            </button>
          </div>
        </form>
      </AppModal>

      <DeleteDialog isOpen={!!deleteOpen} onClose={() => setDeleteOpen(null)} onConfirm={handleDelete} loading={deleting}
        message={`Delete medical record for ${deleteOpen?.driverName}? This action cannot be reversed.`} />
    </div>
  );
}

const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>;

export default MedicalList;
