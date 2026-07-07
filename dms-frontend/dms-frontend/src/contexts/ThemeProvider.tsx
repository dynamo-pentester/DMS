import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useUiStore } from "@/store/uiStore";
import { buildMuiTheme } from "@/theme/muiTheme";

/**
 * Single source of truth for light/dark mode. Toggling `theme` in useUiStore:
 *  - swaps the MUI theme (Material components)
 *  - toggles the `dark` class on <html> so Tailwind's `dark:` variants apply
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme);
  const muiTheme = useMemo(() => buildMuiTheme(theme), [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
