import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";

/**
 * UI-only screen. Driver.API has no /api/auth/forgot-password (or reset) endpoint yet,
 * so this collects the email and shows the confirmation state without calling the
 * backend. Wire the `onSubmit` handler up once that endpoint exists.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/10">
          <MailCheck size={22} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Check your email</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          If an account exists for <span className="font-medium">{email}</span>, you'll receive
          reset instructions shortly.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline"
        >
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link
        to="/login"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
      >
        <ArrowLeft size={15} /> Back
      </Link>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reset your password</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Enter your email and we'll send you instructions to reset it.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="you@company.com"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-700"
        >
          Send reset instructions
        </button>
      </form>
    </div>
  );
}
