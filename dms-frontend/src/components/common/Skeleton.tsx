import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-slate-200 dark:bg-slate-800",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-xl",
        variant === "text" && "h-4 w-3/4 rounded-sm",
        className
      )}
    />
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-850">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-5 w-full" />
        </td>
      ))}
    </tr>
  );
}
export default Skeleton;
