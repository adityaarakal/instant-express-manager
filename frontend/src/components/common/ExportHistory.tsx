import { useMemo } from 'react';
import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import { useExportHistoryStore } from '../../store/useExportHistoryStore';

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'income':
      return 'Income';
    case 'expense':
      return 'Expense';
    case 'savings':
      return 'Savings';
    case 'backup':
      return 'Backup';
    default:
      return type;
  }
};

const getTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
  switch (type) {
    case 'income':
      return 'success';
    case 'expense':
      return 'error';
    case 'savings':
      return 'primary';
    case 'backup':
      return 'secondary';
    default:
      return 'default';
  }
};

export function ExportHistory() {
  const { history, clearHistory, getRecentHistory } = useExportHistoryStore();
  const recentHistory = useMemo(() => getRecentHistory(20), [getRecentHistory]);

  if (history.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
        <Stack spacing={1} alignItems="center">
          <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            No export history yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Export transactions or backups to see history here
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <HistoryIcon color="action" />
            <Typography variant="subtitle2" fontWeight="bold">
              Export History
            </Typography>
            <Chip label={`${history.length} total`} size="small" variant="outlined" />
          </Stack>
          {history.length > 0 && (
            <Tooltip title="Clear all export history">
              <IconButton
                size="small"
                onClick={clearHistory}
                aria-label="Clear export history"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Type
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Filename
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Transactions
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Date & Time
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentHistory.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Chip
                      label={getTypeLabel(entry.type)}
                      size="small"
                      color={getTypeColor(entry.type)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {entry.filename}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {entry.transactionCount !== undefined ? (
                      <Typography variant="body2">{entry.transactionCount}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(entry.timestamp)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {history.length > 20 && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Showing last 20 exports. Total: {history.length} exports
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

