import { HelpCircle, Loader2 } from "lucide-react";
import AppModal from "./AppModal";
import clsx from "clsx";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  color?: "primary" | "success" | "warning" | "danger";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  color = "primary",
}: ConfirmDialogProps) {
  const confirmStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-650",
    success: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-650",
    warning: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-650",
    danger: "bg-rose-600 hover:bg-rose-700 dark:bg-rose-50 dark:hover:bg-rose-650",
  };

  const bgStyles = {
    primary: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-450",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-455",
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className={clsx("flex h-12 w-12 items-center justify-center rounded-full", bgStyles[color])}>
          <HelpCircle size={24} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>

        <div className="mt-6 flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50",
              confirmStyles[color]
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
export default ConfirmDialog;
