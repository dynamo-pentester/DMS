import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { Role, Module, Action, hasPermission, hasModuleAccess } from "@/utils/permissions";

interface PermissionContextProps {
  roles: Role[];
  can: (module: Module, action: Action) => boolean;
  canAccessModule: (module: Module) => boolean;
}

const PermissionContext = createContext<PermissionContextProps | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  // Retrieve the logged-in user's roles from Zustand
  const user = useAuthStore((s) => s.user);
  const roles = useMemo(() => (user?.roles || []) as Role[], [user]);

  const value = useMemo(
    () => ({
      roles,
      can: (module: Module, action: Action) => hasPermission(roles, module, action),
      canAccessModule: (module: Module) => hasModuleAccess(roles, module),
    }),
    [roles]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}
