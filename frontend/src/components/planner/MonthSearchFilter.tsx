import { useState, useMemo, memo, useEffect } from 'react';
import { Box, TextField, InputAdornment, Chip, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
interface MonthSearchFilterProps {
  months: Array<{ id: string; monthStart: string; accounts: Array<{ accountName: string }> }>;
  onFilterChange: (filteredMonths: Array<{ id: string; monthStart: string; accounts: Array<{ accountName: string }> }>) => void;
}

export const MonthSearchFilter = memo(function MonthSearchFilter({
  months,
  onFilterChange,
}: MonthSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMonths = useMemo(() => {
    if (!searchTerm.trim()) {
      return months;
    }

    const term = searchTerm.toLowerCase();
    return months.filter((month) => {
      const monthDate = new Date(month.monthStart);
      const monthStr = new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric',
      }).format(monthDate).toLowerCase();

      return (
        monthStr.includes(term) ||
        month.accounts.some((acc) => acc.accountName.toLowerCase().includes(term))
      );
    });
  }, [months, searchTerm]);

  useEffect(() => {
    onFilterChange(filteredMonths);
  }, [filteredMonths, onFilterChange]);

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search months or accounts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <Chip
                icon={<ClearIcon />}
                label="Clear"
                onClick={() => setSearchTerm('')}
                onDelete={() => setSearchTerm('')}
                size="small"
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            </InputAdornment>
          ),
        }}
      />
      {searchTerm && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip
            label={`${filteredMonths.length} month${filteredMonths.length !== 1 ? 's' : ''} found`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>
      )}
    </Box>
  );
});

