import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import type { Bank } from '../../types/banks';

type BankCardProps = {
  bank: Bank;
  isDeleting?: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function BankCard({
  bank,
  isDeleting = false,
  onEdit,
  onDelete,
}: BankCardProps) {
  const getTypeColor = () => {
    switch (bank.type) {
      case 'Bank':
        return 'primary';
      case 'CreditCard':
        return 'secondary';
      case 'Wallet':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card
      sx={{
        border: 1,
        borderColor: 'divider',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack spacing={1.5}>
          {/* Header: Name and Type */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                fontWeight="medium"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  wordBreak: 'break-word',
                }}
              >
                {bank.name}
              </Typography>
            </Box>
            <Chip
              label={bank.type}
              size="small"
              color={getTypeColor()}
              sx={{
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                flexShrink: 0,
                '& .MuiChip-label': {
                  px: { xs: 0.75, sm: 1 },
                },
              }}
            />
          </Stack>

          {/* Details */}
          <Stack spacing={1}>
            {bank.country && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Country:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 500 }}>
                  {bank.country}
                </Typography>
              </Stack>
            )}

            {bank.notes && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' }, display: 'block', mb: 0.5 }}>
                  Notes:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    wordBreak: 'break-word',
                  }}
                >
                  {bank.notes}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" sx={{ gap: 1, pt: 0.5 }}>
            <Tooltip title="Edit Bank">
              <IconButton
                size="small"
                onClick={onEdit}
                disabled={isDeleting}
                aria-label={`Edit bank ${bank.name}`}
                sx={{
                  minWidth: { xs: 40, sm: 48 },
                  minHeight: { xs: 40, sm: 48 },
                  p: { xs: 0.5, sm: 1 },
                }}
              >
                {isDeleting ? (
                  <CircularProgress size={16} aria-label="Deleting" />
                ) : (
                  <EditIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Bank">
              <IconButton
                size="small"
                onClick={onDelete}
                disabled={isDeleting}
                aria-label={`Delete bank ${bank.name}`}
                color="error"
                sx={{
                  minWidth: { xs: 40, sm: 48 },
                  minHeight: { xs: 40, sm: 48 },
                  p: { xs: 0.5, sm: 1 },
                }}
              >
                {isDeleting ? (
                  <CircularProgress size={16} aria-label="Deleting" />
                ) : (
                  <DeleteIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

