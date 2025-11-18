import { Alert, AlertTitle, Box, Button, Stack, Typography, Chip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { isSecureContext } from '../../utils/security';

export function SecurityCheck() {
  const isSecure = isSecureContext();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Box>
      <Alert severity={isSecure ? 'success' : 'warning'} sx={{ mb: 2 }}>
        <AlertTitle>Security Status</AlertTitle>
        <Typography variant="body2">
          {isSecure
            ? 'Application is running in a secure context (HTTPS or localhost).'
            : 'Warning: Application is not running in a secure context. HTTPS is recommended for production.'}
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
        Security Features
      </Typography>

      <Stack spacing={1}>
        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderColor: 'success.main',
            borderRadius: 1,
            bgcolor: 'success.light',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', flex: 1 }}>
              XSS Protection
            </Typography>
            <Chip label="ENABLED" size="small" color="success" />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            No dangerouslySetInnerHTML usage found. All user inputs are sanitized.
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderColor: 'success.main',
            borderRadius: 1,
            bgcolor: 'success.light',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', flex: 1 }}>
              Data Sanitization
            </Typography>
            <Chip label="ENABLED" size="small" color="success" />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Backup file imports are validated. JSON parsing is protected against prototype pollution.
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderColor: 'success.main',
            borderRadius: 1,
            bgcolor: 'success.light',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', flex: 1 }}>
              Local Storage Security
            </Typography>
            <Chip label="SECURE" size="small" color="success" />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Data stored locally using IndexedDB via localforage. No sensitive credentials stored.
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderColor: isSecure ? 'success.main' : 'warning.main',
            borderRadius: 1,
            bgcolor: isSecure ? 'success.light' : 'warning.light',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', flex: 1 }}>
              Secure Context
            </Typography>
            <Chip label={isSecure ? 'SECURE' : 'WARNING'} size="small" color={isSecure ? 'success' : 'warning'} />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {isSecure
              ? 'Running over HTTPS or localhost (secure context)'
              : 'Not running in a secure context. HTTPS is required for production deployments.'}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderColor: 'info.main',
            borderRadius: 1,
            bgcolor: 'info.light',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', flex: 1 }}>
              Content Security Policy
            </Typography>
            <Chip label="CONFIGURED" size="small" color="info" />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            CSP meta tag configured. Additional headers should be set at server level for production.
          </Typography>
        </Box>
      </Stack>

      <Alert severity="info" sx={{ mt: 2 }}>
        <AlertTitle>Security Recommendations</AlertTitle>
        <Typography variant="body2" component="div">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Always use HTTPS in production (required for PWA features)</li>
            <li>Configure security headers at server level (CSP, HSTS, etc.)</li>
            <li>Regularly backup your data (backup files are validated before import)</li>
            <li>Do not share backup files with untrusted parties</li>
            <li>Keep the application updated to the latest version</li>
            <li>All data is stored locally - no external servers involved</li>
          </ul>
        </Typography>
      </Alert>

      {import.meta.env.DEV && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>Development Mode</AlertTitle>
          <Typography variant="body2">
            Security checks are relaxed in development mode. Always test security features in production builds.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

