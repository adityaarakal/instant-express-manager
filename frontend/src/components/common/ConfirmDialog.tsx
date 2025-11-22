import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, DialogContentText, useMediaQuery, useTheme } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { Stack } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'error' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const getColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: '100vh', sm: '90vh' },
          width: { xs: '100%', sm: 'auto' },
        },
      }}
    >
      <DialogTitle 
        id="confirm-dialog-title"
        sx={{
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          fontWeight: 700,
          pb: { xs: 1, sm: 2 },
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <WarningIcon 
            color={getColor()} 
            sx={{ fontSize: { xs: 20, sm: 24 } }}
          />
          <Typography 
            variant="h6" 
            component="span"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
              fontWeight: 700,
              wordBreak: 'break-word',
            }}
          >
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent
        sx={{
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
        }}
      >
        <DialogContentText 
          id="confirm-dialog-description"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1, sm: 1.5 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
        }}
      >
        <Button 
          onClick={onCancel} 
          color="inherit"
          fullWidth={isMobile}
          sx={{
            minHeight: { xs: 44, sm: 40 },
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            px: { xs: 1.5, sm: 2 },
          }}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          color={getColor()} 
          variant="contained" 
          autoFocus
          fullWidth={isMobile}
          sx={{
            minHeight: { xs: 44, sm: 40 },
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            px: { xs: 1.5, sm: 2 },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

