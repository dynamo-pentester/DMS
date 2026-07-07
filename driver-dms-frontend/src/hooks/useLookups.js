import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useLookupStore } from "../store/userStore";

// Call once near the app root (inside DashboardLayout) to ensure lookups
// are fetched exactly once per authenticated session.
export function useLookups() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadAll = useLookupStore((s) => s.loadAll);
  const reset = useLookupStore((s) => s.reset);

  useEffect(() => {
    if (isAuthenticated) {
      loadAll();
    } else {
      reset();
    }
  }, [isAuthenticated, loadAll, reset]);

  return useLookupStore();
}
