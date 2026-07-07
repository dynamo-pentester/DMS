import { Box, Breadcrumbs, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ReactNode } from 'react';

interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }} separator="›">
          {breadcrumbs.map((c, i) =>
            c.to ? (
              <MuiLink key={i} component={RouterLink} to={c.to} underline="hover" color="text.secondary" variant="body2">
                {c.label}
              </MuiLink>
            ) : (
              <Typography key={i} variant="body2" color="text.secondary">
                {c.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h1">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Stack direction="row" spacing={1.5}>{actions}</Stack>}
      </Stack>
    </Box>
  );
}
