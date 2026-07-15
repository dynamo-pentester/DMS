import { ReactNode } from "react";
import clsx from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = "primary",
  className = "",
}: StatCardProps) {
  const borderColors = {
    primary: "border-l-4 border-blue-500",
    secondary: "border-l-4 border-teal-500",
    success: "border-l-4 border-emerald-500",
    warning: "border-l-4 border-amber-500",
    danger: "border-l-4 border-rose-500",
    info: "border-l-4 border-sky-500",
  };

  const bgIcons = {
    primary: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    secondary: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-450",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-455",
    info: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  };

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg dark:bg-slate-900",
        borderColors[color],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {title}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">
            {value}
          </h3>
        </div>
        <div className={clsx("flex h-11 w-11 items-center justify-center rounded-xl", bgIcons[color])}>
          {icon}
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3.5 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={clsx(
                "font-semibold",
                trend.isPositive ? "text-emerald-600 dark:text-emerald-450" : "text-rose-600 dark:text-rose-450"
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-400 dark:text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
export default StatCard;
