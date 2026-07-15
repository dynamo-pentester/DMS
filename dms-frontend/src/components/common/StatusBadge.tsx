import clsx from "clsx";

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  if (!status) return null;

  const normalized = status.trim();

  // Color assignments
  let badgeStyles = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350";

  switch (normalized) {
    // Expiry compliant levels
    case "Valid":
    case "Active":
    case "Pass":
    case "True":
    case "Completed":
    case "High Severity": // Low incident / resolved, or positive statuses
      badgeStyles = "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-450";
      break;

    case "Expiring":
    case "Warning":
    case "Suspended":
    case "Medium":
    case "Pending":
      badgeStyles = "bg-amber-50 text-amber-800 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400";
      break;

    case "Expired":
    case "Critical":
    case "High":
    case "Failed":
    case "False":
    case "Inactive":
    case "Blacklisted":
      badgeStyles = "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-450";
      break;

    case "Low":
    case "On-Duty":
    case "On Site":
    case "Dismissed":
      badgeStyles = "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400";
      break;
      
    case "Minor":
    case "On-Leave":
      badgeStyles = "bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-500/10 dark:text-sky-400";
      break;
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-transparent transition-colors",
        badgeStyles,
        className
      )}
    >
      {normalized}
    </span>
  );
}
export default StatusBadge;
