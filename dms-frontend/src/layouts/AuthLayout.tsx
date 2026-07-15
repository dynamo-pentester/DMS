import { Outlet } from "react-router-dom";
import { Truck, ShieldCheck, Clock, FileCheck2 } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Truck className="text-white" size={20} />
          </div>
          <span className="text-lg font-bold text-white">Driver DMS</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="max-w-md text-3xl font-bold leading-tight text-white">
            Keep every driver, license, and site movement audit-ready.
          </h1>
          <p className="max-w-sm text-primary-100">
            Track compliance across licenses, medical fitness, training, and incidents
            from one place.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Feature icon={ShieldCheck} text="Role-based access for every team" />
            <Feature icon={Clock} text="Expiry tracking for licenses & medical checks" />
            <Feature icon={FileCheck2} text="Full incident and corrective-action history" />
          </div>
        </div>

        <p className="relative text-xs text-primary-100/70">
          © {new Date().getFullYear()} Driver Management System
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-12 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/90">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <Icon size={16} />
      </div>
      {text}
    </div>
  );
}
