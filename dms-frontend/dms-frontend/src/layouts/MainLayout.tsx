import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";


export function MainLayout() {

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <Sidebar />
      <div
        className="flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out"
      >
        <Topbar />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
