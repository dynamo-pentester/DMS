import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

interface UiState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const prefersDark =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: prefersDark ? "dark" : "light",
      sidebarOpen: true,
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      setTheme: (mode) => set({ theme: mode }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    { name: "dms-ui" }
  )
);
