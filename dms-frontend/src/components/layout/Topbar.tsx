import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Sun, Moon } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { Breadcrumb } from "./Breadcrumb";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";
import { driverService } from "@/services/driverService";
import type { Driver } from "@/types/driver";

export function Topbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const navigate = useNavigate();

  // ── Search state ────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Debounced API call — fires 300ms after the user stops typing
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await driverService.search({ searchTerm: trimmed, page: 1, pageSize: 8 });
        setResults(res.items);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(driver: Driver) {
    setOpen(false);
    setQuery("");
    navigate(`/drivers?search=${encodeURIComponent(driver.driverCode)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    navigate(`/drivers?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      {/* Left section: hamburger, breadcrumb, search bar */}
      <div className="flex flex-1 items-center gap-3 sm:gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div className="hidden lg:block shrink-0">
          <Breadcrumb />
        </div>

        {/* Search bar: positioned immediately after the breadcrumb */}
        <div className="relative flex items-center" ref={searchRef}>
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Submit search"
            >
              <Search size={16} />
            </button>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (results.length > 0 || query.trim().length >= 2) setOpen(true); }}
              placeholder="Search drivers, licenses, incidents…"
              className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-800 dark:focus:ring-primary-500/20 sm:w-80 lg:w-96"
            />
          </form>

          {/* Results dropdown */}
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[20rem] rounded-xl border border-slate-200/70 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {loading && (
                <p className="px-4 py-3 text-sm text-slate-400">Searching…</p>
              )}
              {!loading && results.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">No results found</p>
              )}
              {!loading && results.map((driver) => (
                <button
                  key={driver.driverId}
                  onClick={() => handleSelect(driver)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <span className="font-mono text-xs text-slate-400">{driver.driverCode}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{driver.fullName}</span>
                  {driver.currentTransporterName && (
                    <span className="ml-auto text-xs text-slate-400">{driver.currentTransporterName}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right section: theme toggle, notification, and user profile */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
