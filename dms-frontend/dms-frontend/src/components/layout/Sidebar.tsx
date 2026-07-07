import { NavLink } from "react-router-dom";
import { Truck, X } from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS } from "@/routes/navConfig";
import { useUiStore } from "@/store/uiStore";
import { usePermissions } from "@/contexts/PermissionContext";

export function Sidebar() {
  const { canAccessModule } = usePermissions();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  const isVisible = (item: (typeof NAV_ITEMS)[number]) =>
    !item.module || canAccessModule(item.module);

  const mainItems   = NAV_ITEMS.filter((i) => !i.bottom && isVisible(i));
  const bottomItems = NAV_ITEMS.filter((i) =>  i.bottom && isVisible(i));

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    );

  return (
    <>
      {/* Mobile scrim */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white/90 backdrop-blur-sm transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900/90 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 text-white shadow-soft">
              <Truck size={18} strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Driver DMS</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Fleet compliance</p>
            </div>
          </div>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          {mainItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={linkClass}
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom items (admin-only) */}
        {bottomItems.length > 0 && (
          <div className="flex-shrink-0 border-t border-slate-200/70 px-3 py-3 dark:border-slate-800">
            {bottomItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={linkClass}
              >
                <item.icon size={18} strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
