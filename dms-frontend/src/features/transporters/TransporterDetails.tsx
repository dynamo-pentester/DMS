import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { PlusCircle, UserMinus, Clock, Users, Phone, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { api } from "@/api/axiosInstance";
import AppTable from "@/components/common/AppTable";
import AppModal from "@/components/common/AppModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatusBadge from "@/components/common/StatusBadge";
import { RoleGuard } from "@/components/common/RoleGuard";
import type { Transporter, DriverTransporterAssignment } from "@/types/transporter";
import { format } from "date-fns";
import { lookupService } from "@/services/lookupService";
import DriverSearchCombobox from "@/components/common/DriverSearchCombobox";

interface TransporterDetailsProps {
  transporter: Transporter;
  onRefresh: () => void;
}

export function TransporterDetails({ transporter, onRefresh }: TransporterDetailsProps) {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const [historyList, setHistoryList] = useState<DriverTransporterAssignment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Driver Assignment state
  const [assignOpen, setAssignOpen] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number | "">("");
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split("T")[0]);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Unassign confirmation state
  const [unassignOpen, setUnassignOpen] = useState<number | null>(null);
  const [unassigning, setUnassigning] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data } = await api.get<DriverTransporterAssignment[]>(`/transporters/${transporter.transporterId}/drivers`);
      setHistoryList(data || []);
    } catch {
      toast.error("Failed to load driver assignments history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [transporter.transporterId]);

  // Load drivers for assignment dropdown
  const loadDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const data = await lookupService.getDrivers();
      
      // Filter out drivers already assigned currently to this transporter or other transporters if status matches
      const activeDrivers = data.filter((d: any) => d.currentStatusName === "Active" && !d.currentTransporterName);
      setAvailableDrivers(activeDrivers);
    } catch {
      toast.error("Failed to load compliant available drivers");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleOpenAssign = () => {
    loadDrivers();
    setSelectedDriverId("");
    setAssignDate(new Date().toISOString().split("T")[0]);
    setAssignOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;

    try {
      setSubmittingAssign(true);
      await api.post(`/transporters/${transporter.transporterId}/drivers`, {
        driverId: Number(selectedDriverId),
        assignmentDate: assignDate,
      });
      toast.success("Driver assigned successfully");
      setAssignOpen(false);
      fetchHistory();
      onRefresh(); // refresh driver count in list
    } catch (err: any) {
      toast.error(err.message || "Failed to assign driver");
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleUnassignConfirm = async () => {
    if (!unassignOpen) return;
    try {
      setUnassigning(true);
      await api.delete(`/transporters/${transporter.transporterId}/drivers/${unassignOpen}`);
      toast.success("Driver unassigned successfully");
      setUnassignOpen(null);
      fetchHistory();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to release driver");
    } finally {
      setUnassigning(false);
    }
  };

  const activeAssignments = historyList.filter((x) => x.isCurrent || !x.endDate);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-4">Transporter Agency Details</h2>

      {/* Contact Summary grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-6 text-sm">
        <div className="flex items-center gap-2.5">
          <Users size={16} className="text-slate-400" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Contact Person</div>
            <div className="font-medium text-slate-800 dark:text-slate-200">{transporter.contactPerson || "-"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Phone size={16} className="text-slate-400" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Mobile Phone</div>
            <div className="font-medium text-slate-800 dark:text-slate-200">{transporter.mobile || "-"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-slate-400" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Agreement Valid Till</div>
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {transporter.agreementValidTill ? format(new Date(transporter.agreementValidTill), "dd MMM yyyy") : "-"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Agency Status</div>
            <StatusBadge status={transporter.isActive ? "Active" : "Inactive"} />
          </div>
        </div>
        <div className="sm:col-span-2 flex items-start gap-2.5">
          <MapPin size={16} className="text-slate-400 mt-0.5" />
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Office Address</div>
            <div className="font-medium text-slate-850 dark:text-slate-250">{transporter.address || "-"}</div>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-100 dark:border-slate-800 flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 ${
            activeTab === "active"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/20"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users size={16} /> Currently Assigned ({activeAssignments.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/20"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Clock size={16} /> Assignment Log History ({historyList.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "active" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Currently Assigned Drivers</h3>
              <RoleGuard module="Transporters" action="assign">
                <button
                  onClick={handleOpenAssign}
                  className="inline-flex items-center gap-1 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 dark:bg-blue-500"
                >
                  <PlusCircle size={13} /> Assign Driver
                </button>
              </RoleGuard>
            </div>
            <AppTable
              loading={loadingHistory}
              data={activeAssignments}
              emptyTitle="No drivers assigned"
              emptyDescription="Use the Assign button to link compliance-eligible drivers to this transporter."
              columns={[
                { key: "driverName", header: "Driver Name", className: "font-semibold" },
                {
                  key: "assignmentDate",
                  header: "Assignment Started",
                  render: (row) => format(new Date(row.assignmentDate), "dd MMM yyyy"),
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex justify-end">
                      <RoleGuard module="Transporters" action="assign">
                        <button
                          onClick={() => setUnassignOpen(row.driverId)}
                          className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400"
                        >
                          <UserMinus size={12} /> Release
                        </button>
                      </RoleGuard>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Transporter Assignment History</h3>
            <AppTable
              loading={loadingHistory}
              data={historyList}
              columns={[
                { key: "driverName", header: "Driver Name", className: "font-semibold" },
                {
                  key: "assignmentDate",
                  header: "Assignment Started",
                  render: (row) => format(new Date(row.assignmentDate), "dd MMM yyyy"),
                },
                {
                  key: "endDate",
                  header: "Assignment Ended",
                  render: (row) => row.endDate ? format(new Date(row.endDate), "dd MMM yyyy") : "Active",
                },
                {
                  key: "isCurrent",
                  header: "Current State",
                  render: (row) => <StatusBadge status={row.isCurrent ? "Active" : "Released"} />,
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* Assign Driver Dialog */}
      <AppModal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Driver to Transporter">
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Available Driver *
            </label>
            <DriverSearchCombobox
              items={availableDrivers}
              value={selectedDriverId}
              onChange={(id) => setSelectedDriverId(id)}
              loading={loadingDrivers}
              disabled={submittingAssign}
              required
              placeholder="Search by name, code or license no..."
            />
            {availableDrivers.length === 0 && !loadingDrivers && (
              <p className="mt-1.5 text-xs text-amber-600">
                No active, unassigned drivers are currently available. Register or reactivate drivers first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Assignment Date *
            </label>
            <input
              type="date"
              required
              disabled={submittingAssign}
              value={assignDate}
              onChange={(e) => setAssignDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              disabled={submittingAssign}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAssign || !selectedDriverId}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500"
            >
              Assign Driver
            </button>
          </div>
        </form>
      </AppModal>

      {/* Confirm Unassign */}
      <ConfirmDialog
        isOpen={unassignOpen !== null}
        onClose={() => setUnassignOpen(null)}
        onConfirm={handleUnassignConfirm}
        title="Unassign Driver"
        message="Are you sure you want to release this driver from this transporter agency? They will become available for assignment elsewhere."
        confirmText="Release Driver"
        color="warning"
        loading={unassigning}
      />
    </div>
  );
}
export default TransporterDetails;
