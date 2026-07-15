import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { incidentService } from "@/services/incidentService";
import { lookupService, type DriverLookupItem } from "@/services/lookupService";
import LicenseDriverSelect from "@/components/common/LicenseDriverSelect";
import { RoleGuard } from "@/components/common/RoleGuard";
import PageHeader from "@/components/common/PageHeader";
import FilterDrawer from "@/components/common/FilterDrawer";
import AppTable from "@/components/common/AppTable";
import Pagination from "@/components/common/Pagination";
import AppModal from "@/components/common/AppModal";
import DeleteDialog from "@/components/common/DeleteDialog";
import FileUpload from "@/components/common/FileUpload";
import InlineFileSelect from "@/components/common/InlineFileSelect";
import type { Incident, IncidentSearchParams, CorrectiveAction } from "@/types/incident";
import type { LookupItem } from "@/types/common";
import { format } from "date-fns";

export function IncidentsList() {
  const [items, setItems] = useState<Incident[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<IncidentSearchParams>({ page: 1, pageSize: 10 });

  const [incidentTypes, setIncidentTypes] = useState<LookupItem[]>([]);
  const [drivers, setDrivers] = useState<DriverLookupItem[]>([]);
  const [penaltyTypes, setPenaltyTypes] = useState<LookupItem[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Incident | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState<Incident | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [caFormOpen, setCaFormOpen] = useState<Incident | null>(null);
  const [caSubmitting, setCaSubmitting] = useState(false);
  const [caData, setCaData] = useState<any>({ actionTaken: "", actionDate: "", penaltyTypeId: "" });

  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  // Report document selected inline during create - uploaded together with the
  // incident in a single request. Not used when editing (Replace still happens
  // via the compact FileUpload control in the table).
  const [report, setReport] = useState<File | null>(null);
  // Apology document optionally attached when adding a corrective action.
  const [apologyDoc, setApologyDoc] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      lookupService.getIncidentTypes(),
      lookupService.getDrivers(),
      lookupService.getPenaltyTypes(),
    ])
      .then(([types, drvs, penalties]) => { setIncidentTypes(types); setDrivers(drvs); setPenaltyTypes(penalties); })
      .catch(console.error);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await incidentService.search(searchParams);
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch { toast.error("Failed to load incidents"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [searchParams]);

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({ driverId: "", licenseId: "", incidentTypeId: "", incidentDate: "", location: "", description: "", severity: "", faultAtDriver: false, fatalitiesCount: 0, injuriesCount: 0, transporterName: "", transporterChanged: false });
    setReport(null);
    setFormOpen(true);
  };

  const openEditForm = (item: Incident) => {
    setEditingItem(item);
    setFormData({
      incidentTypeId: incidentTypes.find(t => t.name === item.incidentTypeName)?.id || "",
      incidentDate: item.incidentDate.split("T")[0],
      location: item.location || "",
      description: item.description || "",
      severity: item.severity || "",
      faultAtDriver: item.faultAtDriver,
      fatalitiesCount: item.fatalitiesCount,
      injuriesCount: item.injuriesCount,
    });
    setReport(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingItem) {
        await incidentService.update(editingItem.incidentId, { ...formData, incidentTypeId: Number(formData.incidentTypeId), fatalitiesCount: Number(formData.fatalitiesCount), injuriesCount: Number(formData.injuriesCount) });
        toast.success("Incident updated");
      } else {
        await incidentService.create({ ...formData, driverId: Number(formData.driverId), incidentTypeId: Number(formData.incidentTypeId), fatalitiesCount: Number(formData.fatalitiesCount), injuriesCount: Number(formData.injuriesCount) }, report);
        toast.success("Incident reported");
      }
      setFormOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Failed to save"); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteOpen) return;
    try {
      setDeleting(true);
      await incidentService.delete(deleteOpen.incidentId);
      toast.success("Incident deleted");
      setDeleteOpen(null);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Delete failed"); } finally { setDeleting(false); }
  };

  const handleAddCA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caFormOpen) return;
    try {
      setCaSubmitting(true);
      await incidentService.addCorrectiveAction(
        caFormOpen.incidentId,
        { ...caData, penaltyTypeId: caData.penaltyTypeId ? Number(caData.penaltyTypeId) : undefined, incidentId: caFormOpen.incidentId },
        apologyDoc
      );
      toast.success("Corrective action added");
      setCaFormOpen(null);
      setCaData({ actionTaken: "", actionDate: "", penaltyTypeId: "" });
      setApologyDoc(null);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Failed to save corrective action"); } finally { setCaSubmitting(false); }
  };

  const severityColors: Record<string, string> = {
    Low: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    Medium: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    High: "text-orange-600 bg-orange-50 dark:bg-orange-900/30",
    Critical: "text-rose-600 bg-rose-50 dark:bg-rose-900/30",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Incidents"
        description="Report, track, and resolve driver-involved safety incidents. Log corrective actions to close incidents."
        actions={
          <RoleGuard module="Incidents" action="create">
            <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500">
              <Plus size={18} /> Report Incident
            </button>
          </RoleGuard>
        }
      />

      <div className="flex items-center justify-end gap-3">
        <button onClick={() => setFilterDrawerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Filter size={16} /> Filter
          {(searchParams.severity || searchParams.licenseNo) && <span className="ml-1 h-2 w-2 rounded-full bg-blue-600" />}
        </button>
      </div>

      <AppTable
          loading={loading} data={items}
          emptyTitle="No incidents reported"
          emptyDescription="No driver incidents found. Use the button above to log a new incident."
          columns={[
            {
              key: "expand", header: "",
              render: (row) => (
                <button onClick={() => setExpandedRow(expandedRow === row.incidentId ? null : row.incidentId)} className="text-slate-400 hover:text-slate-600">
                  {expandedRow === row.incidentId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )
            },
            { key: "driverName", header: "Driver", className: "font-semibold" },
            { key: "incidentTypeName", header: "Incident Type" },
            {
              key: "severity", header: "Severity",
              render: (row) => (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityColors[row.severity] || "text-slate-500 bg-slate-100"}`}>
                  {row.severity}
                </span>
              )
            },
            { key: "incidentDate", header: "Date", render: (row) => format(new Date(row.incidentDate), "dd MMM yyyy") },
            { key: "location", header: "Location", render: (row) => row.location || "-" },
            {
              key: "transporterName", header: "Transporter",
              render: (row) => row.transporterName
                ? <span className="text-xs">{row.transporterName}{row.transporterChanged && <span className="ml-1 text-[10px] font-semibold text-amber-600">(changed)</span>}</span>
                : <span className="text-xs text-slate-400">-</span>
            },
            {
              key: "correctiveActions", header: "Corrective Actions",
              render: (row) => (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <span className={`h-5 w-5 rounded-full text-[10px] flex items-center justify-center ${(row.correctiveActions?.length || 0) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    {row.correctiveActions?.length || 0}
                  </span>
                  Action{(row.correctiveActions?.length || 0) !== 1 ? "s" : ""}
                </span>
              )
            },
            {
              key: "report", header: "Report",
              render: (row) => (
                <FileUpload
                  compact
                  label="Incident Report"
                  variant="document"
                  hasFile={row.hasReport}
                  fileUrl={`/incidents/${row.incidentId}/report`}
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  onUpload={async (file) => {
                    await incidentService.uploadReport(row.incidentId, file);
                    fetchData();
                  }}
                />
              )
            },
            {
              key: "actions", header: "",
              render: (row) => (
                <div className="flex items-center justify-end gap-2">
                  <RoleGuard module="Incidents" action="update">
                    <button onClick={() => setCaFormOpen(row)} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                      + Action
                    </button>
                  </RoleGuard>
                  <RoleGuard module="Incidents" action="update">
                    <button onClick={() => openEditForm(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"><PencilIcon /></button>
                  </RoleGuard>
                  <RoleGuard module="Incidents" action="delete">
                    <button onClick={() => setDeleteOpen(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"><TrashIcon /></button>
                  </RoleGuard>
                </div>
              )
            },
          ]}
          renderExpanded={(row) =>
            expandedRow === row.incidentId ? (
              <div className="px-6 pb-5 pt-2 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Description: </span>{row.description || "No description provided."}
                </p>
                {row.correctiveActions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Corrective Actions</p>
                    <div className="space-y-2">
                      {row.correctiveActions.map((ca: CorrectiveAction) => (
                        <div key={ca.correctiveActionId} className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
                          <div className="flex-1">
                            <p className="text-xs text-slate-700 dark:text-slate-300">{ca.actionTaken}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{format(new Date(ca.actionDate), "dd MMM yyyy")}{ca.penaltyTypeName ? ` • ${ca.penaltyTypeName}` : ""}</p>
                          </div>
                          <FileUpload
                            compact
                            label="Letter of Apology / Attachment"
                            variant="document"
                            hasFile={ca.hasAttachment}
                            fileUrl={`/incidents/${row.incidentId}/corrective-actions/${ca.correctiveActionId}/attachment`}
                            accept=".pdf,.jpg,.jpeg,.png,.docx"
                            onUpload={async (file) => {
                              await incidentService.uploadCorrectiveActionAttachment(row.incidentId, ca.correctiveActionId, file);
                              fetchData();
                            }}
                          />
                          {ca.hasApologyDocument && (
                            <FileUpload
                              compact
                              label="Apology Document"
                              variant="document"
                              hasFile={ca.hasApologyDocument}
                              fileUrl={incidentService.getApologyDocumentUrl(row.incidentId, ca.correctiveActionId)}
                              accept=".pdf,.jpg,.jpeg,.png,.docx"
                              disabled
                              onUpload={async () => { /* view/download only — upload happens at CA creation time */ }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null
          }
        />

      <Pagination currentPage={searchParams.page || 1} pageSize={searchParams.pageSize || 10} totalCount={totalCount} onPageChange={p => setSearchParams(prev => ({ ...prev, page: p }))} />

      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} title="Filter Incidents">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">License ID</label>
            <input type="text" placeholder="Search by License No" value={searchParams.licenseNo || ""}
              onChange={e => setSearchParams(p => ({ ...p, licenseNo: e.target.value || undefined, page: 1 }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Severity</label>
            <select value={searchParams.severity || ""} onChange={e => setSearchParams(p => ({ ...p, severity: e.target.value || undefined, page: 1 }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              <option value="">All Severities</option>
              {["Low", "Medium", "High", "Critical"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={() => setFilterDrawerOpen(false)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white">Apply</button>
        </div>
      </FilterDrawer>

      {/* Incident Form Modal */}
      <AppModal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingItem ? "Edit Incident" : "Report New Incident"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingItem && (
            <LicenseDriverSelect
              value={formData.licenseId || ""}
              required
              onChange={(licenseId, license) => {
                const driverId = license?.driverId ? String(license.driverId) : "";
                const selectedDriver = drivers.find(d => String(d.id) === driverId);
                setFormData({
                  ...formData,
                  licenseId,
                  driverId,
                  transporterName: selectedDriver?.currentTransporterName || "",
                  transporterChanged: false,
                });
              }}
            />
          )}
          {!editingItem && formData.driverId && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/20 space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500">Transporter (on file)</label>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {drivers.find(d => String(d.id) === String(formData.driverId))?.currentTransporterName || "No transporter on file"}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={!formData.transporterChanged}
                  onChange={e => {
                    const stillSame = e.target.checked;
                    const selectedDriver = drivers.find(d => String(d.id) === String(formData.driverId));
                    setFormData({
                      ...formData,
                      transporterChanged: !stillSame,
                      transporterName: stillSame ? (selectedDriver?.currentTransporterName || "") : "",
                    });
                  }}
                  className="rounded"
                />
                Driver still working with the same contractor/transporter?
              </label>
              {formData.transporterChanged && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500">New Transporter Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.transporterName || ""}
                    onChange={e => setFormData({ ...formData, transporterName: e.target.value })}
                    placeholder="Enter the driver's new transporter/contractor"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Incident Type *</label>
              <select required value={formData.incidentTypeId || ""} onChange={e => setFormData({ ...formData, incidentTypeId: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                <option value="">Select Type</option>
                {incidentTypes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Severity *</label>
              <select required value={formData.severity || ""} onChange={e => setFormData({ ...formData, severity: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                <option value="">Select</option>
                {["Low", "Medium", "High", "Critical"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Incident Date *</label>
              <input type="date" required value={formData.incidentDate || ""} onChange={e => setFormData({ ...formData, incidentDate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Location</label>
              <input type="text" value={formData.location || ""} onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Fatalities</label>
              <input type="number" min={0} value={formData.fatalitiesCount ?? 0} onChange={e => setFormData({ ...formData, fatalitiesCount: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Injuries</label>
              <input type="number" min={0} value={formData.injuriesCount ?? 0} onChange={e => setFormData({ ...formData, injuriesCount: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium">
            <input type="checkbox" checked={formData.faultAtDriver || false} onChange={e => setFormData({ ...formData, faultAtDriver: e.target.checked })} className="rounded" />
            Fault at Driver
          </label>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Description</label>
            <textarea rows={3} value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
          </div>
          {!editingItem && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Incident Report</label>
              <InlineFileSelect
                label="Incident Report"
                variant="document"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                allowedExtensions={[".pdf", ".jpg", ".jpeg", ".png", ".docx"]}
                maxSizeMb={10}
                hint="PDF, JPG, PNG, or DOCX, up to 10 MB"
                value={report}
                onChange={setReport}
                disabled={submitting}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {editingItem ? "Save Changes" : "Report Incident"}
            </button>
          </div>
        </form>
      </AppModal>

      {/* Corrective Action Modal */}
      <AppModal isOpen={!!caFormOpen} onClose={() => setCaFormOpen(null)} title="Add Corrective Action">
        <form onSubmit={handleAddCA} className="space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold">{caFormOpen?.driverName}</span> — {caFormOpen?.incidentTypeName}
            <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${severityColors[caFormOpen?.severity || ""] || ""}`}>{caFormOpen?.severity}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Action Taken *</label>
            <textarea rows={3} required value={caData.actionTaken} onChange={e => setCaData({ ...caData, actionTaken: e.target.value })}
              placeholder="Describe the corrective action taken..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Action Date *</label>
              <input type="date" required value={caData.actionDate} onChange={e => setCaData({ ...caData, actionDate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Penalty Type</label>
              <select value={caData.penaltyTypeId} onChange={e => setCaData({ ...caData, penaltyTypeId: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                <option value="">None</option>
                {penaltyTypes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Apology Document</label>
            <InlineFileSelect
              label="Apology Document"
              variant="document"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              allowedExtensions={[".pdf", ".jpg", ".jpeg", ".png", ".docx"]}
              maxSizeMb={10}
              hint="PDF, JPG, PNG, or DOCX, up to 10 MB"
              value={apologyDoc}
              onChange={setApologyDoc}
              disabled={caSubmitting}
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setCaFormOpen(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800">Cancel</button>
            <button type="submit" disabled={caSubmitting} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              Add Action
            </button>
          </div>
        </form>
      </AppModal>

      <DeleteDialog isOpen={!!deleteOpen} onClose={() => setDeleteOpen(null)} onConfirm={handleDelete} loading={deleting}
        message={`Delete ${deleteOpen?.incidentTypeName} incident for ${deleteOpen?.driverName}? All corrective actions will also be removed.`} />
    </div>
  );
}

const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>;

export default IncidentsList;
