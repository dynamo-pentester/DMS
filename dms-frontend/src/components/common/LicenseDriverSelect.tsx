import { useEffect, useState, useRef, useMemo } from "react";
import { lookupService, type LicenseLookupItem } from "@/services/lookupService";

interface LicenseDriverSelectProps {
  /** Currently selected licenseId (as string, to match native <select> values) */
  value: string;
  /** Fired with the chosen licenseId, plus the full record (driverId, names, etc.) for auto-fill */
  onChange: (licenseId: string, license: LicenseLookupItem | null) => void;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Searchable combobox that filters by license number, driver code, or driver name.
 * Replaces plain Driver-name dropdowns wherever the client asked for License ID
 * to be the primary selector (Trainings, Medical Records, Incidents, Reports &
 * Analytics filters, Drivers list filter). Choosing a License No resolves the
 * driver behind it so the parent form can auto-fill driver-specific fields.
 *
 * Matching logic: case-insensitive substring match on licenseNo, driverCode,
 * and driverFullName — so typing the last 4 digits of a license number works.
 */
export default function LicenseDriverSelect({
  value,
  onChange,
  label = "License ID",
  required = false,
  className = "",
  disabled = false,
}: LicenseDriverSelectProps) {
  const [licenses, setLicenses] = useState<LicenseLookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    lookupService
      .getLicenses()
      .then(setLicenses)
      .finally(() => setLoading(false));
  }, []);

  const selected = licenses.find((l) => String(l.licenseId) === value) || null;

  // Keep the text input in sync when the selection is set externally
  useEffect(() => {
    if (selected && !open) {
      setQuery(`${selected.licenseNo} — ${selected.driverCode} — ${selected.driverFullName}`);
    } else if (!value && !open) {
      setQuery("");
    }
  }, [value, selected, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return licenses;
    return licenses.filter(
      (l) =>
        l.licenseNo.toLowerCase().includes(q) ||
        l.driverCode.toLowerCase().includes(q) ||
        l.driverFullName.toLowerCase().includes(q)
    );
  }, [licenses, query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Restore display text for current selection when blurring without new pick
        if (selected) {
          setQuery(`${selected.licenseNo} — ${selected.driverCode} — ${selected.driverFullName}`);
        } else if (!value) {
          setQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected, value]);

  const handleSelect = (license: LicenseLookupItem) => {
    setQuery(`${license.licenseNo} — ${license.driverCode} — ${license.driverFullName}`);
    setOpen(false);
    setHighlightedIndex(-1);
    onChange(String(license.licenseId), license);
  };

  const handleClear = () => {
    setQuery("");
    setOpen(false);
    setHighlightedIndex(-1);
    onChange("", null);
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
          setQuery(`${selected.licenseNo} — ${selected.driverCode} — ${selected.driverFullName}`);
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
        <label className="block text-xs font-semibold text-slate-500">
          {label}{required ? " *" : ""}
        </label>
      )}

      {/* Hidden native input to carry the actual licenseId for form validation */}
      <input
        type="hidden"
        required={required}
        value={value || ""}
        onChange={() => {/* controlled via onChange prop */}}
      />

      <div className="relative mt-1.5">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled || loading}
          placeholder={loading ? "Loading licenses..." : "Search by license no., driver name or code…"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightedIndex(0);
            // Clear selection if user starts typing something different
            if (value && selected) {
              const currentDisplay = `${selected.licenseNo} — ${selected.driverCode} — ${selected.driverFullName}`;
              if (e.target.value !== currentDisplay) {
                onChange("", null);
              }
            }
          }}
          onFocus={() => {
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-900 disabled:opacity-60"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            tabIndex={-1}
            aria-label="Clear selection"
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
            filtered.map((l, idx) => (
              <li
                key={l.licenseId}
                role="option"
                aria-selected={String(l.licenseId) === value}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(l); }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`cursor-pointer px-3 py-2 text-xs transition-colors ${
                  idx === highlightedIndex
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : String(l.licenseId) === value
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span className="font-semibold font-mono">{l.licenseNo}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-slate-500">{l.driverCode}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span>{l.driverFullName}</span>
              </li>
            ))
          ) : (
            <li className="px-3 py-4 text-center text-xs text-slate-400">
              No licenses match "<span className="font-medium">{query}</span>"
            </li>
          )}
        </ul>
      )}

      {selected && (
        <p className="mt-1 text-xs text-slate-500">
          Driver: <span className="font-medium text-slate-700 dark:text-slate-300">{selected.driverCode} — {selected.driverFullName}</span>
        </p>
      )}
    </div>
  );
}
