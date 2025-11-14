import { useEffect, useState } from 'react';
import { Alert, AlertTitle, Button, Snackbar, Stack } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import CloseIcon from '@mui/icons-material/Close';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user has dismissed the prompt before (stored in localStorage)
    const dismissedBefore = localStorage.getItem('pwa-install-dismissed');
    if (dismissedBefore) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setOpen(false);
  };

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
    // Store dismissal in localStorage (expires after 7 days)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (dismissed || !deferredPrompt || !open) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      onClose={handleDismiss}
    >
      <Alert
        severity="info"
        action={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              size="small"
              onClick={handleDismiss}
              startIcon={<CloseIcon />}
            >
              Dismiss
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={handleInstall}
              startIcon={<GetAppIcon />}
              variant="contained"
            >
              Install
            </Button>
          </Stack>
        }
        sx={{ minWidth: '300px' }}
      >
        <AlertTitle>Install App</AlertTitle>
        Install this app on your device for a better experience and offline access.
      </Alert>
    </Snackbar>
  );
}

