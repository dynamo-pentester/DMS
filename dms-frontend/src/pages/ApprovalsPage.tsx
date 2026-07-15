import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { usePermissions } from "@/contexts/PermissionContext";
import { approvalService } from "@/services/approvalService";
import type { DriverApproval } from "@/types/approval";
import PageHeader from "@/components/common/PageHeader";
import AppTable from "@/components/common/AppTable";
import AppModal from "@/components/common/AppModal";

export default function ApprovalsPage() {
  const { roles } = usePermissions();
  const isManager = roles.includes("HOD");
  const isEmployee = roles.includes("Employee");

  const [approvals, setApprovals] = useState<DriverApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "approve" | "reject";
    approvalId: number;
    driverName: string;
  } | null>(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      if (isManager) {
        // Manager sees all pending requests submitted by Employees
        const data = await approvalService.getPending();
        setApprovals(data);
      } else if (isEmployee) {
        // Employee sees only their own submitted requests
        const data = await approvalService.getMyRequests();
        setApprovals(data);
      }
      // Admin has no access to this module — routed away by permissions
    } catch (err) {
      console.error(err);
      toast.error("Failed to load approvals list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [roles]);

  const handleActionClick = (type: "approve" | "reject", approvalId: number, driverName: string) => {
    setActionModal({
      isOpen: true,
      type,
      approvalId,
      driverName,
    });
    setComments("");
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      if (actionModal.type === "approve") {
        await approvalService.approve(actionModal.approvalId, comments);
        toast.success(`Driver approved: ${actionModal.driverName}`);
      } else {
        await approvalService.reject(actionModal.approvalId, comments);
        toast.success(`Driver request rejected: ${actionModal.driverName}`);
      }
      setActionModal(null);
      fetchApprovals();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit decision.");
    } finally {
      setSubmitting(false);
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-950/30 dark:text-green-400">
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400">
            Pending Approval
          </span>
        );
    }
  };

  // Dynamic header based on role
  const pageTitle = isEmployee
    ? "My Approval Requests"
    : "Driver Approval Actions";

  const pageDesc = isEmployee
    ? "Track status and manager feedback of your submitted driver enlistment requests."
    : "Review and approve or reject driver enrollment files submitted by Employee staff.";

  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} description={pageDesc} />

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft-sm dark:border-slate-800/80 dark:bg-slate-950">
        <AppTable
          loading={loading}
          data={approvals}
          emptyTitle="No approval requests found"
          emptyDescription={
            isManager
              ? "All caught up! There are no pending driver requests awaiting your decision."
              : "You haven't submitted any driver records requiring approval yet."
          }
          columns={[
            { key: "driverCode", header: "Driver Code", className: "font-semibold" },
            { key: "driverName", header: "Driver Name" },
            // Show "Requested By" column only for Manager view
            ...(isManager
              ? [{ key: "requestedByName", header: "Submitted By", render: (row: any) => row.requestedByName || `User #${row.requestedByUserId}` }]
              : []),
            {
              key: "requestedDate",
              header: "Requested Date",
              render: (row) => new Date(row.requestedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => renderStatusBadge(row.status),
            },
            // Remarks column for Employee tracking their requests
            ...(isEmployee
              ? [
                  {
                    key: "comments",
                    header: "Remarks / Feedback",
                    render: (row: any) => (
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        {row.comments || <em className="text-slate-300 dark:text-slate-600">No comments yet</em>}
                      </span>
                    ),
                  },
                ]
              : []),
            // Approve/Reject actions only for Manager
            ...(isManager
              ? [
                  {
                    key: "actions",
                    header: "",
                    render: (row: any) =>
                      row.status === "PendingApproval" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleActionClick("approve", row.id, row.driverName)}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleActionClick("reject", row.id, row.driverName)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      ),
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* Decision comments Modal */}
      {actionModal && (
        <AppModal
          isOpen={actionModal.isOpen}
          onClose={() => setActionModal(null)}
          title={actionModal.type === "approve" ? "Approve Driver Request" : "Reject Driver Request"}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You are about to {actionModal.type} the enrollment request for driver{" "}
                <strong>{actionModal.driverName}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Remarks / Comments (Optional for approval, recommended for rejection)
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter feedback or validation notes here..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/60">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setActionModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmAction}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white ${
                  actionModal.type === "approve"
                    ? "bg-green-600 hover:bg-green-700 dark:bg-green-500"
                    : "bg-rose-600 hover:bg-rose-700 dark:bg-rose-500"
                }`}
              >
                {submitting ? "Submitting..." : `Confirm ${actionModal.type === "approve" ? "Approval" : "Rejection"}`}
              </button>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
}
