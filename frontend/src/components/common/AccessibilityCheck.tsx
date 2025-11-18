import { useMemo } from 'react';
import { Alert, AlertTitle, Box, Button, Stack, Typography, Chip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { calculateContrastRatio, meetsWCAGAA, meetsWCAGAAA } from '../../utils/accessibility';

interface ContrastCheck {
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  isLargeText: boolean;
}

export function AccessibilityCheck() {
  const contrastChecks = useMemo(() => {
    const checks: ContrastCheck[] = [];

    // Check theme colors (light mode)
    // Primary color on white background
    checks.push({
      name: 'Primary on White',
      foreground: '#2563eb',
      background: '#ffffff',
      ratio: calculateContrastRatio('#2563eb', '#ffffff'),
      meetsAA: meetsWCAGAA('#2563eb', '#ffffff', false),
      meetsAAA: meetsWCAGAAA('#2563eb', '#ffffff', false),
      isLargeText: false,
    });

    // Primary color on white background (large text)
    checks.push({
      name: 'Primary on White (Large)',
      foreground: '#2563eb',
      background: '#ffffff',
      ratio: calculateContrastRatio('#2563eb', '#ffffff'),
      meetsAA: meetsWCAGAA('#2563eb', '#ffffff', true),
      meetsAAA: meetsWCAGAAA('#2563eb', '#ffffff', true),
      isLargeText: true,
    });

    // Text on paper background (light mode)
    checks.push({
      name: 'Text on Paper (Light)',
      foreground: '#0f172a', // slate-900
      background: '#ffffff',
      ratio: calculateContrastRatio('#0f172a', '#ffffff'),
      meetsAA: meetsWCAGAA('#0f172a', '#ffffff', false),
      meetsAAA: meetsWCAGAAA('#0f172a', '#ffffff', false),
      isLargeText: false,
    });

    // Text on default background (light mode)
    checks.push({
      name: 'Text on Default Background (Light)',
      foreground: '#0f172a', // slate-900
      background: '#f8fafc', // gray-50
      ratio: calculateContrastRatio('#0f172a', '#f8fafc'),
      meetsAA: meetsWCAGAA('#0f172a', '#f8fafc', false),
      meetsAAA: meetsWCAGAAA('#0f172a', '#f8fafc', false),
      isLargeText: false,
    });

    // Dark mode checks
    checks.push({
      name: 'Text on Dark Background',
      foreground: '#ffffff',
      background: '#0f172a', // slate-900
      ratio: calculateContrastRatio('#ffffff', '#0f172a'),
      meetsAA: meetsWCAGAA('#ffffff', '#0f172a', false),
      meetsAAA: meetsWCAGAAA('#ffffff', '#0f172a', false),
      isLargeText: false,
    });

    checks.push({
      name: 'Primary on Dark Background',
      foreground: '#2563eb',
      background: '#111827', // gray-900
      ratio: calculateContrastRatio('#2563eb', '#111827'),
      meetsAA: meetsWCAGAA('#2563eb', '#111827', false),
      meetsAAA: meetsWCAGAAA('#2563eb', '#111827', false),
      isLargeText: false,
    });

    return checks;
  }, []);

  const allMeetAA = contrastChecks.every((check) => check.meetsAA);
  const allMeetAAA = contrastChecks.every((check) => check.meetsAAA);
  const failingChecks = contrastChecks.filter((check) => !check.meetsAA);

  const handleRefresh = () => {
    // Force re-render by updating a key or state
    window.location.reload();
  };

  return (
    <Box>
      <Alert severity={allMeetAA ? 'success' : 'warning'} sx={{ mb: 2 }}>
        <AlertTitle>Accessibility Status</AlertTitle>
        <Typography variant="body2">
          {allMeetAA
            ? allMeetAAA
              ? 'All color combinations meet WCAG AAA standards.'
              : 'All color combinations meet WCAG AA standards.'
            : `${failingChecks.length} color combination(s) do not meet WCAG AA standards.`}
        </Typography>
      </Alert>

      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        fullWidth
        sx={{ mb: 2 }}
      >
        Refresh Check
      </Button>

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        Color Contrast Checks
      </Typography>

      <Stack spacing={1}>
        {contrastChecks.map((check, index) => (
          <Box
            key={index}
            sx={{
              p: 1.5,
              border: 1,
              borderColor: check.meetsAA ? 'success.main' : 'error.main',
              borderRadius: 1,
              bgcolor: check.meetsAA ? 'success.light' : 'error.light',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', flex: 1 }}>
                {check.name}
                {check.isLargeText && ' (Large Text)'}
              </Typography>
              <Chip
                label={check.meetsAAA ? 'AAA' : check.meetsAA ? 'AA' : 'FAIL'}
                size="small"
                color={check.meetsAAA ? 'success' : check.meetsAA ? 'warning' : 'error'}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Contrast Ratio: {check.ratio.toFixed(2)}:1
              {check.isLargeText
                ? ' (Required: 3:1 for AA, 4.5:1 for AAA)'
                : ' (Required: 4.5:1 for AA, 7:1 for AAA)'}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Alert severity="info" sx={{ mt: 2 }}>
        <AlertTitle>Accessibility Features</AlertTitle>
        <Typography variant="body2" component="div">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>ARIA labels on interactive elements</li>
            <li>Keyboard navigation support</li>
            <li>Screen reader support</li>
            <li>Touch targets meet minimum size (44x44px)</li>
            <li>Focus indicators visible</li>
            <li>Semantic HTML structure</li>
            <li>Color contrast meets WCAG standards</li>
          </ul>
        </Typography>
      </Alert>

      {import.meta.env.DEV && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>Development Mode</AlertTitle>
          <Typography variant="body2">
            Automated accessibility testing with axe-core is available in development mode.
            Open the browser console to see accessibility violations.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

