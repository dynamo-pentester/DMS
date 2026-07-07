import { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { TableRowSkeleton } from "./Skeleton";
import EmptyState from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface AppTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  className?: string;
  /** Optional: render an expanded row panel below each row */
  renderExpanded?: (row: T) => ReactNode;
}

export function AppTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle,
  emptyDescription,
  sortColumn,
  sortDirection,
  onSort,
  className = "",
  renderExpanded,
}: AppTableProps<T>) {
  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key);
    }
  };

  return (
    <div className={clsx("w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-350">
          <thead className="bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-800/40 dark:text-slate-500">
            <tr>
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={clsx(
                      "p-4 font-semibold select-none",
                      col.sortable && "cursor-pointer hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && (
                        <span className="text-slate-300 dark:text-slate-600">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ChevronUp size={14} className="text-primary-500" />
                            ) : (
                              <ChevronDown size={14} className="text-primary-500" />
                            )
                          ) : (
                            <ChevronDown size={14} className="opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={`skeleton-${i}`} cols={columns.length} />
              ))
            ) : data.length > 0 ? (
              data.map((row, rowIdx) => (
                <>
                  <tr
                    key={`row-${rowIdx}`}
                    className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={clsx("p-4 align-middle text-slate-700 dark:text-slate-300", col.className)}>
                        {col.render ? col.render(row) : (row as any)[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                  {renderExpanded && (
                    <tr key={`expanded-${rowIdx}`}>
                      <td colSpan={columns.length} className="p-0">
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default AppTable;
