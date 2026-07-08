import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  User,
  Truck,
  IdCard,
  FileText,
  GraduationCap,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import clsx from "clsx";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { usePermissions } from "@/contexts/PermissionContext";
import toast from "react-hot-toast";

export function Sidebar() {
  const { canAccessModule } = usePermissions();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Successfully signed out");
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Drivers", path: "/drivers", icon: Users, module: "Drivers" },
    { label: "Managers", path: "/users?role=Manager", icon: ShieldCheck, module: "Users" },
    { label: "Employees", path: "/users?role=Employee", icon: User, module: "Users" },
    { label: "Vehicle Allocation", path: "/transporters", icon: Truck, module: "Transporters" },
    { label: "License Management", path: "/licenses", icon: IdCard, module: "Licenses" },
    { label: "Documents", path: "/medical-records", icon: FileText, module: "MedicalRecords" },
    { label: "Training", path: "/trainings", icon: GraduationCap, module: "Trainings" },
    { label: "Reports", path: "/reports", icon: BarChart3, module: "Reports" },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Settings", path: "/profile", icon: Settings },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.module || canAccessModule(item.module as any)
  );

  const isLinkActive = (path: string) => {
    // Exact match or matches path prefix
    if (path.includes("?")) {
      return location.pathname + location.search === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile drawer scrim */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/60 bg-white shadow-sm transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "w-64" : "w-20",
          // On mobile, show full slide drawer
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo/Header */}
        <div className={clsx("flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800", !sidebarOpen && "lg:justify-center lg:px-0")}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Truck size={18} strokeWidth={2.5} />
            </div>
            {sidebarOpen && (
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Driver DMS</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Fleet compliance</p>
              </div>
            )}
          </div>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map((item) => {
            const active = isLinkActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Only close mobile drawer
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={clsx(
                  "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-150",
                  !sidebarOpen && "lg:justify-center lg:px-0 lg:h-10 lg:w-10 lg:mx-auto"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon
                  size={18}
                  strokeWidth={2}
                  className={clsx(
                    "flex-shrink-0 transition-colors",
                    active ? "text-blue-600 dark:text-blue-400" : "text-slate-450 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )}
                />
                {sidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t border-slate-100 p-3 dark:border-slate-800 space-y-1">
          <button
            onClick={handleLogout}
            className={clsx(
              "group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-all duration-150",
              !sidebarOpen && "lg:justify-center lg:px-0 lg:h-10 lg:w-10 lg:mx-auto"
            )}
            title={!sidebarOpen ? "Sign Out" : undefined}
          >
            <LogOut
              size={18}
              className="flex-shrink-0 text-slate-450 group-hover:text-rose-500 transition-colors"
            />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex w-full items-center justify-center rounded-xl py-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-850 dark:hover:text-slate-350 transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <div className="flex items-center gap-1.5 text-xs">
                <ChevronLeft size={16} />
                <span>Collapse Panel</span>
              </div>
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
