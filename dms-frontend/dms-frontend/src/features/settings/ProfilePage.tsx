import { User, Mail, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

/**
 * Read-only for now: Driver.API has no GET/PUT /api/users/me endpoint, so this
 * renders what's already in the JWT (name, email, roles) rather than fetching
 * a separate profile record. Revisit if a Users module is added to the backend.
 */
export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My profile</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Your account details as recorded by the system.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.roles.join(", ")}</p>
          </div>
        </div>

        <hr className="my-6 border-slate-100 dark:border-slate-800" />

        <dl className="space-y-4">
          <Row icon={User} label="Full name" value={user.fullName} />
          <Row icon={Mail} label="Email" value={user.email} />
          <Row icon={ShieldCheck} label="Roles" value={user.roles.join(", ")} />
        </dl>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon size={15} />
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</dd>
      </div>
    </div>
  );
}
