import { Box, Typography } from '@mui/material';
import { statusColors } from '@/theme/theme';

interface StatusChipProps {
  status: string;
}

/**
 * The one status indicator used everywhere in the app: a small colored dot plus
 * label. Every expiry-driven module (Licenses, Medical, Trainings) and every
 * state field (Driver status, Notification status, Transporter active flag)
 * renders through this component so "Expiring" always means the same shade of
 * amber no matter which screen you're on.
 */
export function StatusChip({ status }: StatusChipProps) {
  const color = statusColors[status] ?? '#5B6270';
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
        {status}
      </Typography>
    </Box>
  );
}
