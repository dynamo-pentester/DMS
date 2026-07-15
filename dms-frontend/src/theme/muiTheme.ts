import { createTheme } from "@mui/material/styles";
import type { ThemeMode } from "@/store/uiStore";

// Kept in sync with tailwind.config.js so MUI components (Select, DatePicker, Dialog)
// visually match the Tailwind-styled surfaces around them.
export function buildMuiTheme(mode: ThemeMode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#2563eb",
        light: "#60a5fa",
        dark: "#1d4ed8",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#0d9488",
        light: "#2dd4bf",
        dark: "#0f766e",
        contrastText: "#ffffff",
      },
      error: { main: "#dc2626" },
      success: { main: "#16a34a" },
      background: {
        default: mode === "dark" ? "#0f172a" : "#f8fafc",
        paper: mode === "dark" ? "#1e293b" : "#ffffff",
      },
    },
    typography: {
      fontFamily: ['"Inter"', "system-ui", "sans-serif"].join(","),
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
      },
    },
  });
}
