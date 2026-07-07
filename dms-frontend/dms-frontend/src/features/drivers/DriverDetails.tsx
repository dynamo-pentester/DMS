import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IdCard,
  HeartPulse,
  GraduationCap,
  ShieldAlert,
  History,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle,
  HelpCircle,
  FileText,
  User,
  Phone,
  Droplet,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/api/axiosInstance";
import { RoleGuard } from "@/components/common/RoleGuard";
import AppTable from "@/components/common/AppTable";
import AppModal from "@/components/common/AppModal";
import DeleteDialog from "@/components/common/DeleteDialog";
import StatusBadge from "@/components/common/StatusBadge";
import { lookupService } from "@/services/lookupService";
import type { LookupItem } from "@/types/common";
import type { Driver } from "@/types/driver";
import { format } from "date-fns";

interface DriverDetailsProps {
  driver: Driver;
  onRefresh: () => void;
}

type TabType = "licenses" | "medical" | "trainings" | "incidents" | "assignments";

export function DriverDetails({ driver, onRefresh }: DriverDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("licenses");

  // Sub-items lists
  const [licenses, setLicenses] = useState<any[]>([]);
  const [medicals, setMedicals] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Modal forms states
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"license" | "medical" | "training" | "incident" | "action">("license");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actionIncidentId, setActionIncidentId] = useState<number | null>(null);

  // Deletion states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"license" | "medical" | "training" | "incident" | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lookup selections cache
  const [lookups, setLookups] = useState<{
    vehicleTypes: LookupItem[];
    endorsements: LookupItem[];
    fitnessStatuses: LookupItem[];
    trainingTypes: LookupItem[];
    incidentTypes: LookupItem[];
    severityLevels: LookupItem[];
    penaltyTypes: LookupItem[];
  }>({
    vehicleTypes: [],
    endorsements: [],
    fitnessStatuses: [],
    trainingTypes: [],
    incidentTypes: [],
    severityLevels: [],
    penaltyTypes: [],
  });

  // Load sub-lists
  const loadSubItems = async () => {
    try {
      setLoadingItems(true);
      const [licRes, medRes, trRes, incRes, transportersRes] = await Promise.all([
        api.get(`/licenses?driverId=${driver.driverId}`).catch(() => ({ data: { items: [] } })),
        api.get(`/medical-records?driverId=${driver.driverId}`).catch(() => ({ data: { items: [] } })),
        api.get(`/trainings?driverId=${driver.driverId}`).catch(() => ({ data: { items: [] } })),
        api.get(`/incidents?driverId=${driver.driverId}`).catch(() => ({ data: { items: [] } })),
        api.get(`/transporters?page=1&pageSize=1000`).catch(() => ({ data: { items: [] } })),
      ]);

      setLicenses(licRes.data.items || []);
      setMedicals(medRes.data.items || []);
      setTrainings(trRes.data.items || []);
      setIncidents(incRes.data.items || []);

      // Pull active assignment history logic:
      // Loop over transporters to see if assignments include this driver
      const allAssignments: any[] = [];
      const transportersList = transportersRes.data.items || [];
      for (const t of transportersList) {
        try {
          const assignmentsRes = await api.get(`/transporters/${t.transporterId}/drivers`);
          const history = assignmentsRes.data || [];
          const driverHistory = history.filter((x: any) => x.driverId === driver.driverId);
          allAssignments.push(...driverHistory);
        } catch {
          // ignore failures on sub-assignments fetch
        }
      }
      allAssignments.sort((a, b) => new Date(b.assignmentDate).getTime() - new Date(a.assignmentDate).getTime());
      setAssignments(allAssignments);
    } catch {
      toast.error("Failed to load driver sub-records");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadSubItems();
  }, [driver.driverId]);

  // Load lookups
  useEffect(() => {
    async function loadLookups() {
      try {
        const [vt, end, fs, tt, it, sl, pt] = await Promise.all([
          lookupService.getVehicleTypes(),
          lookupService.getEndorsements(),
          lookupService.getFitnessStatuses(),
          lookupService.getTrainingTypes(),
          lookupService.getIncidentTypes(),
          lookupService.getSeverityLevels(),
          lookupService.getPenaltyTypes(),
        ]);
        setLookups({
          vehicleTypes: vt,
          endorsements: end,
          fitnessStatuses: fs,
          trainingTypes: tt,
          incidentTypes: it,
          severityLevels: sl,
          penaltyTypes: pt,
        });
      } catch (err) {
        console.error("Lookups load failure", err);
      }
    }
    loadLookups();
  }, []);

  // CRUD Form Handlers
  const handleOpenForm = (type: typeof formType, item: any = null, incidentId: number | null = null) => {
    setFormType(type);
    setSelectedItem(item);
    setActionIncidentId(incidentId);
    setFormOpen(true);
  };

  const handleOpenDelete = (type: "license" | "medical" | "training" | "incident", id: number) => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteType || !deleteId) return;
    try {
      setDeleting(true);
      const urlMap = {
        license: `/licenses/${deleteId}`,
        medical: `/medical-records/${deleteId}`,
        training: `/trainings/${deleteId}`,
        incident: `/incidents/${deleteId}`,
      };
      await api.delete(urlMap[deleteType]);
      toast.success(`${deleteType.toUpperCase()} record deleted successfully`);
      setDeleteOpen(false);
      loadSubItems();
      onRefresh(); // refresh driver compliance status at page header if affected
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-4">Driver Profile Details</h2>

      {/* Driver summary card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-6 text-sm">
        <div className="flex items-center gap-2.5">
          <User size={16} className="text-slate-400" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Father's Name</div>
            <div className="font-medium text-slate-800 dark:text-slate-200">{driver.fatherName || "-"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-slate-400" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Date of Birth</div>
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {driver.dateOfBirth ? format(new Date(driver.dateOfBirth), "dd MMM yyyy") : "-"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Phone size={16} className="text-slate-400" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Mobile Number</div>
            <div className="font-medium text-slate-800 dark:text-slate-200">{driver.mobile || "-"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Droplet size={16} className="text-rose-500" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Blood Group</div>
            <div className="font-medium text-slate-800 dark:text-slate-200">{driver.bloodGroupName || "-"}</div>
          </div>
        </div>
        {driver.aadhaarLast4 && (
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-slate-400" />
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Aadhaar (Last 4)</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">xxxx-xxxx-{driver.aadhaarLast4}</div>
            </div>
          </div>
        )}
        {driver.currentTransporterName && (
          <div className="flex items-center gap-2.5">
            <History size={16} className="text-slate-400" />
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Transporter</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{driver.currentTransporterName}</div>
            </div>
          </div>
        )}
        <div className="sm:col-span-2 flex items-start gap-2.5">
          <FileText size={16} className="text-slate-400 mt-0.5" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Registered Address</div>
            <div className="font-medium text-slate-850 dark:text-slate-250">{driver.address || "-"}</div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 mb-6">
        {[
          { key: "licenses", label: "Licenses", icon: IdCard },
          { key: "medical", label: "Medical Fitness", icon: HeartPulse },
          { key: "trainings", label: "Trainings / PEP", icon: GraduationCap },
          { key: "incidents", label: "Safety Incidents", icon: ShieldAlert },
          { key: "assignments", label: "Transporter Logs", icon: History },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/20"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab contents */}
      <div>
        {activeTab === "licenses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Registered Licenses</h3>
              <RoleGuard module="Licenses" action="create">
                <button
                  onClick={() => handleOpenForm("license")}
                  className="inline-flex items-center gap-1 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 dark:bg-blue-500"
                >
                  <Plus size={14} /> Add License
                </button>
              </RoleGuard>
            </div>
            <AppTable
              loading={loadingItems}
              data={licenses}
              columns={[
                { key: "licenseNo", header: "License No" },
                { key: "vehicleTypeName", header: "Vehicle Type" },
                {
                  key: "endorsements",
                  header: "Endorsements",
                  render: (row) => (
                    <div className="flex flex-wrap gap-1">
                      {row.endorsements?.map((e: string) => (
                        <span key={e} className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          {e}
                        </span>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "issueDate",
                  header: "Issue Date",
                  render: (row) => format(new Date(row.issueDate), "dd MMM yyyy"),
                },
                {
                  key: "validTill",
                  header: "Expiry Date",
                  render: (row) => format(new Date(row.validTill), "dd MMM yyyy"),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex items-center justify-end gap-2">
                      <RoleGuard module="Licenses" action="update">
                        <button
                          onClick={() => handleOpenForm("license", row)}
                          className="p-1 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"
                        >
                          <Edit2 size={14} />
                        </button>
                      </RoleGuard>
                      <RoleGuard module="Licenses" action="delete">
                        <button
                          onClick={() => handleOpenDelete("license", row.licenseId)}
                          className="p-1 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </RoleGuard>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {activeTab === "medical" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Medical & Fitness Records</h3>
              <RoleGuard module="MedicalRecords" action="create">
                <button
                  onClick={() => handleOpenForm("medical")}
                  className="inline-flex items-center gap-1 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 dark:bg-blue-500"
                >
                  <Plus size={14} /> Add Record
                </button>
              </RoleGuard>
            </div>
            <AppTable
              loading={loadingItems}
              data={medicals}
              columns={[
                {
                  key: "examDate",
                  header: "Exam Date",
                  render: (row) => format(new Date(row.examDate), "dd MMM yyyy"),
                },
                { key: "fitnessStatusName", header: "Fitness Level" },
                { key: "bp", header: "BP Info" },
                {
                  key: "visionTestPass",
                  header: "Vision",
                  render: (row) => <StatusBadge status={row.visionTestPass ? "Pass" : "Failed"} />,
                },
                {
                  key: "alcoholTestPass",
                  header: "Alcohol Screen",
                  render: (row) => <StatusBadge status={row.alcoholTestPass ? "Pass" : "Failed"} />,
                },
                {
                  key: "validTill",
                  header: "Expiry Date",
                  render: (row) => format(new Date(row.validTill), "dd MMM yyyy"),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex items-center justify-end gap-2">
                      <RoleGuard module="MedicalRecords" action="update">
                        <button
                          onClick={() => handleOpenForm("medical", row)}
                          className="p-1 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"
                        >
                          <Edit2 size={14} />
                        </button>
                      </RoleGuard>
                      <RoleGuard module="MedicalRecords" action="delete">
                        <button
                          onClick={() => handleOpenDelete("medical", row.medicalRecordId)}
                          className="p-1 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </RoleGuard>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {activeTab === "trainings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Training Completions</h3>
              <RoleGuard module="Trainings" action="create">
                <button
                  onClick={() => handleOpenForm("training")}
                  className="inline-flex items-center gap-1 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 dark:bg-blue-500"
                >
                  <Plus size={14} /> Add Training
                </button>
              </RoleGuard>
            </div>
            <AppTable
              loading={loadingItems}
              data={trainings}
              columns={[
                { key: "trainingTypeName", header: "Training Program" },
                {
                  key: "dateCompleted",
                  header: "Completed On",
                  render: (row) => format(new Date(row.dateCompleted), "dd MMM yyyy"),
                },
                {
                  key: "validUpto",
                  header: "Valid Till",
                  render: (row) => format(new Date(row.validUpto), "dd MMM yyyy"),
                },
                { key: "trainerName", header: "Trainer" },
                {
                  key: "status",
                  header: "Compliance Status",
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex items-center justify-end gap-2">
                      <RoleGuard module="Trainings" action="update">
                        <button
                          onClick={() => handleOpenForm("training", row)}
                          className="p-1 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"
                        >
                          <Edit2 size={14} />
                        </button>
                      </RoleGuard>
                      <RoleGuard module="Trainings" action="delete">
                        <button
                          onClick={() => handleOpenDelete("training", row.trainingId)}
                          className="p-1 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </RoleGuard>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {activeTab === "incidents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Safety Incidents Logs</h3>
              <RoleGuard module="Incidents" action="create">
                <button
                  onClick={() => handleOpenForm("incident")}
                  className="inline-flex items-center gap-1 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 dark:bg-blue-500"
                >
                  <Plus size={14} /> Report Incident
                </button>
              </RoleGuard>
            </div>
            <div className="space-y-4">
              {incidents.length > 0 ? (
                incidents.map((inc) => (
                  <div
                    key={inc.incidentId}
                    className="border border-slate-200 rounded-xl p-4 space-y-3 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-850 dark:text-slate-200">{inc.incidentTypeName}</span>
                          <StatusBadge status={inc.severityLevelName} />
                          {inc.rootCauseCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                              <CheckCircle size={10} /> Root Cause Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                              <HelpCircle size={10} /> RCA Pending
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Date: {format(new Date(inc.incidentDate), "dd MMM yyyy")} | Location: {inc.location || "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RoleGuard module="Incidents" action="update">
                          <button
                            onClick={() => handleOpenForm("incident", inc)}
                            className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"
                          >
                            <Edit2 size={13} />
                          </button>
                        </RoleGuard>
                        <RoleGuard module="Incidents" action="delete">
                          <button
                            onClick={() => handleOpenDelete("incident", inc.incidentId)}
                            className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </RoleGuard>
                      </div>
                    </div>
                    <p className="text-sm text-slate-650 dark:text-slate-350 border-l-2 border-slate-300 pl-3 dark:border-slate-700">
                      {inc.description}
                    </p>

                    {/* Corrective Actions section */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 dark:border-slate-800/60">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corrective Actions</span>
                        <RoleGuard module="Incidents" action="assign">
                          <button
                            onClick={() => handleOpenForm("action", null, inc.incidentId)}
                            className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
                          >
                            <PlusCircle size={12} /> Add Action
                          </button>
                        </RoleGuard>
                      </div>

                      {inc.correctiveActions?.length > 0 ? (
                        <div className="divide-y divide-slate-50 dark:divide-slate-850 space-y-1.5">
                          {inc.correctiveActions.map((act: any) => (
                            <div key={act.correctiveActionId} className="pt-2 text-xs flex justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-300">{act.actionTaken}</p>
                                {act.penaltyTypeName && (
                                  <span className="mt-1 inline-block text-[10px] text-slate-400 dark:text-slate-500">
                                    Penalty Applied: {act.penaltyTypeName}
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 font-medium whitespace-nowrap">
                                {format(new Date(act.actionDate), "dd MMM yyyy")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-xs text-slate-400">
                          No corrective actions logged yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-slate-400">
                  No incident logs found for this driver.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Transporter History Logs</h3>
            <AppTable
              loading={loadingItems}
              data={assignments}
              columns={[
                { key: "transporterName", header: "Transporter Agency" },
                {
                  key: "assignmentDate",
                  header: "Assigned Date",
                  render: (row) => format(new Date(row.assignmentDate), "dd MMM yyyy"),
                },
                {
                  key: "endDate",
                  header: "Released Date",
                  render: (row) => row.endDate ? format(new Date(row.endDate), "dd MMM yyyy") : "Active Assignment",
                },
                {
                  key: "isCurrent",
                  header: "Current Agency",
                  render: (row) => <StatusBadge status={row.isCurrent ? "Active" : "Inactive"} />,
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* CRUD dialog popup */}
      <AppModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          formType === "action"
            ? "Log Corrective Action"
            : selectedItem
            ? `Edit ${formType.toUpperCase()}`
            : `Add ${formType.toUpperCase()}`
        }
      >
        <DetailSubForm
          type={formType}
          item={selectedItem}
          driverId={driver.driverId}
          incidentId={actionIncidentId}
          lookups={lookups}
          onSuccess={() => {
            setFormOpen(false);
            loadSubItems();
            onRefresh(); // refresh main compliance state if dates change
          }}
          onCancel={() => setFormOpen(false)}
        />
      </AppModal>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}

// Inner nested form handler for sub-items
function DetailSubForm({
  type,
  item,
  driverId,
  incidentId,
  lookups,
  onSuccess,
  onCancel,
}: {
  type: "license" | "medical" | "training" | "incident" | "action";
  item: any;
  driverId: number;
  incidentId: number | null;
  lookups: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  // Dynamic inputs mapping
  const [fields, setFields] = useState<any>({});

  // Initialize fields on load
  useEffect(() => {
    if (item) {
      const initFields = { ...item };
      // normalize date strings
      if (initFields.issueDate) initFields.issueDate = initFields.issueDate.split("T")[0];
      if (initFields.validTill) initFields.validTill = initFields.validTill.split("T")[0];
      if (initFields.examDate) initFields.examDate = initFields.examDate.split("T")[0];
      if (initFields.dateCompleted) initFields.dateCompleted = initFields.dateCompleted.split("T")[0];
      if (initFields.validUpto) initFields.validUpto = initFields.validUpto.split("T")[0];
      if (initFields.incidentDate) initFields.incidentDate = initFields.incidentDate.split("T")[0];
      if (initFields.actionDate) initFields.actionDate = initFields.actionDate.split("T")[0];
      setFields(initFields);
    } else {
      // blank init
      const blank: any = {};
      if (type === "license") {
        blank.licenseNo = "";
        blank.issueDate = "";
        blank.validTill = "";
        blank.vehicleTypeId = "";
        blank.endorsementIds = [];
      } else if (type === "medical") {
        blank.examDate = "";
        blank.fitnessStatusId = "";
        blank.bp = "";
        blank.visionTestPass = true;
        blank.alcoholTestPass = true;
        blank.chronicIllness = false;
        blank.chronicIllnessRemarks = "";
        blank.validTill = "";
      } else if (type === "training") {
        blank.trainingTypeId = "";
        blank.dateCompleted = "";
        blank.validUpto = "";
        blank.trainerName = "";
      } else if (type === "incident") {
        blank.incidentDate = "";
        blank.incidentTypeId = "";
        blank.description = "";
        blank.severityLevelId = "";
        blank.location = "";
        blank.rootCauseCompleted = false;
      } else if (type === "action") {
        blank.actionTaken = "";
        blank.penaltyTypeId = "";
        blank.actionDate = new Date().toISOString().split("T")[0];
      }
      setFields(blank);
    }
  }, [item, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const isEdit = !!item;

      // Handle license
      if (type === "license") {
        const payload = {
          ...fields,
          driverId,
          vehicleTypeId: Number(fields.vehicleTypeId),
          endorsementIds: fields.endorsementIds.map(Number),
        };
        if (isEdit) {
          await api.put(`/licenses/${item.licenseId}`, payload);
        } else {
          await api.post("/licenses", payload);
        }
      }

      // Handle medical
      else if (type === "medical") {
        const payload = {
          ...fields,
          driverId,
          fitnessStatusId: Number(fields.fitnessStatusId),
        };
        if (isEdit) {
          await api.put(`/medical-records/${item.medicalRecordId}`, payload);
        } else {
          await api.post("/medical-records", payload);
        }
      }

      // Handle training
      else if (type === "training") {
        const payload = {
          ...fields,
          driverId,
          trainingTypeId: Number(fields.trainingTypeId),
        };
        if (isEdit) {
          await api.put(`/trainings/${item.trainingId}`, payload);
        } else {
          await api.post("/trainings", payload);
        }
      }

      // Handle incident
      else if (type === "incident") {
        const payload = {
          ...fields,
          driverId,
          incidentTypeId: Number(fields.incidentTypeId),
          severityLevelId: Number(fields.severityLevelId),
        };
        if (isEdit) {
          await api.put(`/incidents/${item.incidentId}`, payload);
        } else {
          await api.post("/incidents", payload);
        }
      }

      // Handle action
      else if (type === "action" && incidentId) {
        const payload = {
          ...fields,
          penaltyTypeId: fields.penaltyTypeId ? Number(fields.penaltyTypeId) : undefined,
        };
        await api.post(`/incidents/${incidentId}/corrective-actions`, payload);
      }

      toast.success(`${type.toUpperCase()} recorded successfully`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || `Failed to submit ${type} details`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckboxChange = (id: number, checked: boolean) => {
    const list = [...(fields.endorsementIds || [])];
    if (checked) {
      list.push(id);
    } else {
      const idx = list.indexOf(id);
      if (idx !== -1) list.splice(idx, 1);
    }
    setFields({ ...fields, endorsementIds: list });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === "license" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500">License Number *</label>
              <input
                type="text"
                required
                value={fields.licenseNo || ""}
                onChange={(e) => setFields({ ...fields, licenseNo: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Vehicle Type *</label>
              <select
                required
                value={fields.vehicleTypeId || ""}
                onChange={(e) => setFields({ ...fields, vehicleTypeId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Select Type</option>
                {lookups.vehicleTypes.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Issue Date *</label>
              <input
                type="date"
                required
                value={fields.issueDate || ""}
                onChange={(e) => setFields({ ...fields, issueDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Valid Till (Expiry) *</label>
              <input
                type="date"
                required
                value={fields.validTill || ""}
                onChange={(e) => setFields({ ...fields, validTill: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Endorsements</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-850 rounded-xl">
              {lookups.endorsements.map((x: any) => {
                const isChecked = fields.endorsementIds?.includes(x.id);
                return (
                  <label key={x.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-350 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(x.id, e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500/20"
                    />
                    {x.name}
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}

      {type === "medical" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Examination Date *</label>
              <input
                type="date"
                required
                value={fields.examDate || ""}
                onChange={(e) => setFields({ ...fields, examDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Fitness Status *</label>
              <select
                required
                value={fields.fitnessStatusId || ""}
                onChange={(e) => setFields({ ...fields, fitnessStatusId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Select Status</option>
                {lookups.fitnessStatuses.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Blood Pressure (BP)</label>
              <input
                type="text"
                placeholder="e.g. 120/80"
                value={fields.bp || ""}
                onChange={(e) => setFields({ ...fields, bp: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Valid Till (Expiry) *</label>
              <input
                type="date"
                required
                value={fields.validTill || ""}
                onChange={(e) => setFields({ ...fields, validTill: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 py-2 border-y border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={fields.visionTestPass || false}
                onChange={(e) => setFields({ ...fields, visionTestPass: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500/20"
              />
              Vision Test Passed
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={fields.alcoholTestPass || false}
                onChange={(e) => setFields({ ...fields, alcoholTestPass: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500/20"
              />
              Alcohol Test Passed
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={fields.chronicIllness || false}
                onChange={(e) => setFields({ ...fields, chronicIllness: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500/20"
              />
              Has Chronic Illness
            </label>
          </div>
          {fields.chronicIllness && (
            <div>
              <label className="block text-xs font-semibold text-slate-500">Chronic Illness Remarks</label>
              <textarea
                rows={2}
                value={fields.chronicIllnessRemarks || ""}
                onChange={(e) => setFields({ ...fields, chronicIllnessRemarks: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          )}
        </>
      )}

      {type === "training" && (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500">Training Program Type *</label>
            <select
              required
              value={fields.trainingTypeId || ""}
              onChange={(e) => setFields({ ...fields, trainingTypeId: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Select Program</option>
              {lookups.trainingTypes.map((x: any) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Date Completed *</label>
              <input
                type="date"
                required
                value={fields.dateCompleted || ""}
                onChange={(e) => setFields({ ...fields, dateCompleted: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Valid Upto *</label>
              <input
                type="date"
                required
                value={fields.validUpto || ""}
                onChange={(e) => setFields({ ...fields, validUpto: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Trainer Name</label>
            <input
              type="text"
              value={fields.trainerName || ""}
              onChange={(e) => setFields({ ...fields, trainerName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>
      )}

      {type === "incident" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Incident Date *</label>
              <input
                type="date"
                required
                value={fields.incidentDate || ""}
                onChange={(e) => setFields({ ...fields, incidentDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Incident Type *</label>
              <select
                required
                value={fields.incidentTypeId || ""}
                onChange={(e) => setFields({ ...fields, incidentTypeId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Select Type</option>
                {lookups.incidentTypes.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Severity Level *</label>
              <select
                required
                value={fields.severityLevelId || ""}
                onChange={(e) => setFields({ ...fields, severityLevelId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Select Severity</option>
                {lookups.severityLevels.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Location</label>
              <input
                type="text"
                placeholder="e.g. Mine Gate B"
                value={fields.location || ""}
                onChange={(e) => setFields({ ...fields, location: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Description *</label>
            <textarea
              required
              rows={3}
              value={fields.description || ""}
              onChange={(e) => setFields({ ...fields, description: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 py-2 border-y border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={fields.rootCauseCompleted || false}
                onChange={(e) => setFields({ ...fields, rootCauseCompleted: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500/20"
              />
              Root Cause Analysis Completed
            </label>
          </div>
        </div>
      )}

      {type === "action" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500">Action Taken / Warning details *</label>
            <textarea
              required
              rows={3}
              value={fields.actionTaken || ""}
              placeholder="Detail safety correction instruction, suspensions, or warning details..."
              onChange={(e) => setFields({ ...fields, actionTaken: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Penalty Type (If applicable)</label>
              <select
                value={fields.penaltyTypeId || ""}
                onChange={(e) => setFields({ ...fields, penaltyTypeId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">No Penalty</option>
                {lookups.penaltyTypes.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Action Date *</label>
              <input
                type="date"
                required
                value={fields.actionDate || ""}
                onChange={(e) => setFields({ ...fields, actionDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Submission buttons */}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-650"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Submit Record
        </button>
      </div>
    </form>
  );
}
export default DriverDetails;
