import { createTheme, ThemeOptions } from '@mui/material/styles';

// ---- Design tokens -----------------------------------------------------
// Palette is deliberately restrained: a single desaturated corporate blue
// carries all interactive/brand weight, neutrals do everything else, and
// status color only ever appears on the status-dot system (never as a
// decorative background) so "Expiring" reads the same everywhere in the app.
const tokens = {
  light: {
    bg: '#F4F5F7',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFBFC',
    border: '#E1E4E9',
    textPrimary: '#181B20',
    textSecondary: '#5B6270',
    primary: '#25406E',
    primaryHover: '#1B3057',
    sidebarBg: '#151A24',
    sidebarText: '#AEB6C4',
  },
  dark: {
    bg: '#0F1115',
    surface: '#171A21',
    surfaceAlt: '#1D212A',
    border: '#2A2F3A',
    textPrimary: '#E7E9ED',
    textSecondary: '#98A0AF',
    primary: '#6C8FD1',
    primaryHover: '#8AA6DC',
    sidebarBg: '#0B0D12',
    sidebarText: '#8D95A5',
  },
};

export const statusColors: Record<string, string> = {
  Valid: '#1E8E5A',
  Active: '#1E8E5A',
  Sent: '#1E8E5A',
  Fit: '#1E8E5A',
  Expiring: '#B7791F',
  Pending: '#B7791F',
  'Fit with remarks': '#B7791F',
  Expired: '#C0392B',
  Suspended: '#C0392B',
  Unfit: '#C0392B',
  OnMedicalHold: '#B7791F',
  Retired: '#5B6270',
  Dismissed: '#5B6270',
};

export function getTheme(mode: 'light' | 'dark') {
  const t = tokens[mode];
  const options: ThemeOptions = {
    palette: {
      mode,
      primary: { main: t.primary, dark: t.primaryHover, contrastText: '#fff' },
      background: { default: t.bg, paper: t.surface },
      text: { primary: t.textPrimary, secondary: t.textSecondary },
      divider: t.border,
      error: { main: '#C0392B' },
      warning: { main: '#B7791F' },
      success: { main: '#1E8E5A' },
    },
    shape: { borderRadius: 6 },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: { fontWeight: 700, fontSize: '1.75rem' },
      h2: { fontWeight: 700, fontSize: '1.4rem' },
      h3: { fontWeight: 600, fontSize: '1.15rem' },
      subtitle1: { fontWeight: 600 },
      body2: { fontSize: '0.875rem' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 6, boxShadow: 'none' },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', border: `1px solid ${t.border}` },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: t.surface,
            color: t.textPrimary,
            borderBottom: `1px solid ${t.border}`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: { root: { borderColor: t.border } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundColor: t.sidebarBg, color: t.sidebarText, border: 'none' },
        },
      },
    },
  };
  return createTheme(options);
}

// Utility (mono) font-family token, used for driver codes / license numbers /
// vehicle numbers so identifiers read as data, not prose — applied via the
// `data-mono` className rather than a global override.
export const monoFontFamily = '"IBM Plex Mono", ui-monospace, monospace';
