import { useEffect, useState } from 'react';
import { Alert, AlertTitle, Button, Snackbar, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export function PWAUpdateNotification() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Listen for service worker updates manually
    const initPWA = async () => {
      try {
        // We can't use hooks conditionally, so we'll use a different approach
        // Listen for service worker updates manually
        if ('serviceWorker' in navigator) {
          let refreshing = false;
          
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            setNeedRefresh(true);
          });

          // Check for updates periodically
          const checkForUpdates = async () => {
            try {
              const registration = await navigator.serviceWorker.getRegistration();
              if (registration) {
                await registration.update();
              }
            } catch (error) {
              // Silently fail - PWA update check is non-critical
              // Error handling is not critical for update checking
            }
          };

          // Check for updates every 5 minutes
          const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
          
          // Initial check
          checkForUpdates();

          return () => clearInterval(interval);
        }
      } catch (error) {
        // PWA module not available (dev mode or PWA disabled)
        // Silently ignore - PWA features are only available in production
      }
    };

    initPWA();
  }, []);

  useEffect(() => {
    if (needRefresh) {
      setOpen(true);
    }
  }, [needRefresh]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleUpdate = () => {
    setNeedRefresh(false);
    // Reload the page to apply updates
    window.location.reload();
  };

  if (!needRefresh) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      onClose={handleClose}
      sx={{
        '& .MuiSnackbarContent-root': {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    >
      <Alert
        severity="info"
        action={
          <Stack direction="row" spacing={1}>
            <Button color="inherit" size="small" onClick={handleClose}>
              Later
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={handleUpdate}
              startIcon={<RefreshIcon />}
              variant="contained"
            >
              Update
            </Button>
          </Stack>
        }
        sx={{
          minWidth: { xs: '280px', sm: '300px' },
          maxWidth: { xs: '90vw', sm: '400px' },
          backgroundColor: (theme) => theme.palette.mode === 'dark' 
            ? theme.palette.grey[800] 
            : theme.palette.background.paper,
          color: (theme) => theme.palette.text.primary,
          '& .MuiAlert-icon': {
            color: (theme) => theme.palette.info.main,
          },
          '& .MuiAlert-message': {
            width: '100%',
          },
          boxShadow: (theme) => theme.shadows[8],
          border: (theme) => `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>Update Available</AlertTitle>
        A new version of the app is available. Click Update to refresh.
      </Alert>
    </Snackbar>
  );
}

