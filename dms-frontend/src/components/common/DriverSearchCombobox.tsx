import { useEffect, useRef, useMemo, useState } from "react";

export interface DriverComboboxItem {
  id: number;
  name: string;
  code: string;
  /** Most recent license number for this driver. Used for license-digit search. */
  licenseNo?: string | null;
}

interface DriverSearchComboboxProps {
  items: DriverComboboxItem[];
  value: number | "";
  onChange: (id: number | "") => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

/**
 * Searchable combobox for selecting a driver by name, driver code, OR license number.
 * Case-insensitive substring match — typing the last 4 digits of a license number works.
 *
 * Unlike LicenseDriverSelect (which pivots on the license record), this component
 * pivots on the driver, returning the driverId. Used in Vehicle Allocation / Transporter
 * assignment where the data source is a driver list rather than a license list.
 */
export default function DriverSearchCombobox({
  items,
  value,
  onChange,
  loading = false,
  disabled = false,
  placeholder = "Search by name, code or license no…",
  label,
  required = false,
  className = "",
}: DriverSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = items.find((d) => d.id === value) || null;

  // Keep input text synced when value changes externally
  useEffect(() => {
    if (selected && !open) {
      setQuery(`${selected.name}${selected.licenseNo ? ` (${selected.licenseNo})` : ""}`);
    } else if (!value && !open) {
      setQuery("");
    }
  }, [value, selected, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.licenseNo && d.licenseNo.toLowerCase().includes(q))
    );
  }, [items, query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Restore display text
        if (selected) {
          setQuery(`${selected.name}${selected.licenseNo ? ` (${selected.licenseNo})` : ""}`);
        } else if (!value) {
          setQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected, value]);

  const handleSelect = (driver: DriverComboboxItem) => {
    setQuery(`${driver.name}${driver.licenseNo ? ` (${driver.licenseNo})` : ""}`);
    setOpen(false);
    setHighlightedIndex(-1);
    onChange(driver.id);
  };

  const handleClear = () => {
    setQuery("");
    setOpen(false);
    setHighlightedIndex(-1);
    onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          handleSelect(filtered[highlightedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        if (selected) {
          setQuery(`${selected.name}${selected.licenseNo ? ` (${selected.licenseNo})` : ""}`);
        } else {
          setQuery("");
        }
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}{required ? " *" : ""}
        </label>
      )}

      {/* Hidden native input to carry driverId for form required validation */}
      <input
        type="hidden"
        required={required}
        value={value === "" ? "" : String(value)}
      />

      <div className="relative mt-1.5">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled || loading}
          placeholder={loading ? "Loading drivers…" : placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightedIndex(0);
            // Clear current selection if user edits the text
            if (value && selected) {
              const currentDisplay = `${selected.name}${selected.licenseNo ? ` (${selected.licenseNo})` : ""}`;
              if (e.target.value !== currentDisplay) {
                onChange("");
              }
            }
          }}
          onFocus={() => {
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900 disabled:opacity-60"
        />
        {value !== "" && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            tabIndex={-1}
            aria-label="Clear driver selection"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {open && !loading && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          role="listbox"
        >
          {filtered.length > 0 ? (
            filtered.map((d, idx) => (
              <li
                key={d.id}
                role="option"
                aria-selected={d.id === value}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(d); }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`cursor-pointer px-3 py-2 text-xs transition-colors ${
                  idx === highlightedIndex
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : d.id === value
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span className="font-semibold">{d.name}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="font-mono text-slate-500">{d.code}</span>
                {d.licenseNo && (
                  <>
                    <span className="mx-2 text-slate-400">·</span>
                    <span className="text-slate-400">{d.licenseNo}</span>
                  </>
                )}
              </li>
            ))
          ) : (
            <li className="px-3 py-4 text-center text-xs text-slate-400">
              No drivers match "<span className="font-medium">{query}</span>"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
