import { Box, Chip, CircularProgress, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useSaveStatusStore } from '../../store/useSaveStatusStore';

export function SaveStatusIndicator() {
  const { status, lastSaved } = useSaveStatusStore();

  // Format last saved time
  const lastSavedText = lastSaved
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }).format(lastSaved)
    : null;

  if (status === 'idle') {
    return null;
  }

  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return (
          <Chip
            icon={<CircularProgress size={16} color="inherit" />}
            label="Saving..."
            size="small"
            color="info"
            variant="outlined"
            sx={{
              '& .MuiChip-icon': {
                color: 'info.main',
              },
            }}
          />
        );
      case 'saved':
        return (
          <Tooltip title={lastSavedText ? `Last saved at ${lastSavedText}` : 'Saved'}>
            <Chip
              icon={<CheckCircleIcon fontSize="small" />}
              label="Saved"
              size="small"
              color="success"
              variant="outlined"
            />
          </Tooltip>
        );
      case 'error':
        return (
          <Chip
            icon={<ErrorIcon fontSize="small" />}
            label="Save Failed"
            size="small"
            color="error"
            variant="outlined"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>{getStatusContent()}</Box>
  );
}

