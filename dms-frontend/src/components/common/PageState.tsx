import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PageStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "neutral" | "error";
}

export function PageState({ icon: Icon, title, description, action, tone = "neutral" }: PageStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div
        className={
          "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl " +
          (tone === "error"
            ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-500"
            : "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400")
        }
      >
        <Icon size={28} />
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
