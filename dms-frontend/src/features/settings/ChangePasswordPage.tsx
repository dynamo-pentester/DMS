import { useState } from "react";
import type { FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/**
 * UI-only: Driver.API doesn't expose a change-password endpoint yet (Identity's
 * UserManager supports it, but no controller action calls it). Wire the submit
 * handler up to a real endpoint (e.g. POST /api/auth/change-password) once added.
 */
export function ChangePasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      toast.error("New passwords don't match.");
      return;
    }
    setSubmitting(true);
    // No backend endpoint exists yet - simulate the round trip so the UI is ready
    // to wire up as soon as one exists.
    setTimeout(() => {
      setSubmitting(false);
      toast.error("Change password isn't available yet - no backend endpoint exists.");
    }, 600);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Change password</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Choose a strong password you don't use elsewhere.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <Field
          label="Current password"
          value={form.current}
          onChange={(v) => setForm((f) => ({ ...f, current: v }))}
        />
        <Field
          label="New password"
          value={form.next}
          onChange={(v) => setForm((f) => ({ ...f, next: v }))}
        />
        <Field
          label="Confirm new password"
          value={form.confirm}
          onChange={(v) => setForm((f) => ({ ...f, confirm: v }))}
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-700 disabled:opacity-70"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Update password
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type="password"
        required
        minLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </div>
  );
}
