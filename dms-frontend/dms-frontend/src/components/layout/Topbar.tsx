import { Menu, Search, Sun, Moon } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { Breadcrumb } from "./Breadcrumb";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";

export function Topbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden lg:block">
        <Breadcrumb />
      </div>

      <div className="relative ml-auto flex max-w-md flex-1 items-center lg:ml-6">
        <Search size={16} className="pointer-events-none absolute left-3 text-slate-400" />
        <input
          type="search"
          placeholder="Search drivers, licenses, incidents…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-800 dark:focus:ring-primary-500/20"
        />
      </div>

      <button
        onClick={toggleTheme}
        className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
      </button>

      <NotificationBell />
      <ProfileMenu />
    </header>
  );
}
