import { Snackbar, Alert, AlertTitle, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useToastStore } from '../../store/useToastStore';

export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <Box>
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ position: 'fixed' }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => removeToast(toast.id)}
            action={
              <>
                {toast.action && (
                  <IconButton
                    size="small"
                    aria-label={toast.action.label}
                    color="inherit"
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    sx={{ mr: 1 }}
                  >
                    {toast.action.label}
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={() => removeToast(toast.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
            sx={{ minWidth: '300px', maxWidth: '500px' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
}

