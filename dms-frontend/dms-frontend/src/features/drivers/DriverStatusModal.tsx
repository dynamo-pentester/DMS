import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AppModal from "@/components/common/AppModal";
import { lookupService } from "@/services/lookupService";
import type { LookupItem } from "@/types/common";
import type { Driver } from "@/types/driver";

interface DriverStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  onConfirm: (statusId: number, reason: string) => Promise<void>;
  loading?: boolean;
}

export function DriverStatusModal({
  isOpen,
  onClose,
  driver,
  onConfirm,
  loading = false,
}: DriverStatusModalProps) {
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [fetchingLookups, setFetchingLookups] = useState(true);

  useEffect(() => {
    async function loadStatuses() {
      try {
        const list = await lookupService.getDriverStatusTypes();
        setStatuses(list);
        
        // Find existing status id to default it
        const current = list.find((x) => x.name === driver.currentStatusName);
        if (current) {
          setSelectedStatusId(current.id);
        }
      } catch (err) {
        console.error("Error loading statuses lookup:", err);
      } finally {
        setFetchingLookups(false);
      }
    }

    if (isOpen) {
      loadStatuses();
    }
  }, [isOpen, driver]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatusId !== "") {
      onConfirm(Number(selectedStatusId), reason);
    }
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title={`Update Compliance Status: ${driver.fullName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Compliance Status *
          </label>
          <select
            required
            disabled={loading || fetchingLookups}
            value={selectedStatusId}
            onChange={(e) => setSelectedStatusId(Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Select Status</option>
            {statuses.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Reason / Remarks
          </label>
          <textarea
            rows={3}
            disabled={loading}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide context for status modification..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedStatusId === ""}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-650"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Update Status
          </button>
        </div>
      </form>
    </AppModal>
  );
}
export default DriverStatusModal;
