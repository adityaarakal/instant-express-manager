import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { usePlannedMonthsStore } from '../store/usePlannedMonthsStore';
import { usePlannerStore } from '../store/usePlannerStore';
import { MonthViewHeader } from '../components/planner/MonthViewHeader';
import { StatusRibbon } from '../components/planner/StatusRibbon';
import { AccountTable } from '../components/planner/AccountTable';
import { TotalsFooter } from '../components/planner/TotalsFooter';
import { ImportDialog } from '../components/planner/ImportDialog';
import { ExportDialog } from '../components/planner/ExportDialog';
import { ManualAdjustmentsDialog } from '../components/planner/ManualAdjustmentsDialog';
import { TemplatesDialog } from '../components/planner/TemplatesDialog';
import { MonthSearchFilter } from '../components/planner/MonthSearchFilter';
import { EmptyState } from '../components/common/EmptyState';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { PlannedMonthSnapshot } from '../types/plannedExpenses';

const formatMonthDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const Planner = memo(function Planner() {
  const { months, getMonth, getBucketTotals, seedMonths } = usePlannedMonthsStore();
  const { activeMonthId, setActiveMonth } = usePlannerStore();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [adjustmentsDialogOpen, setAdjustmentsDialogOpen] = useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [filteredMonths, setFilteredMonths] = useState<PlannedMonthSnapshot[]>(months);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'i',
      ctrl: true,
      handler: () => setImportDialogOpen(true),
      description: 'Import data',
    },
    {
      key: 'e',
      ctrl: true,
      handler: () => setExportDialogOpen(true),
      description: 'Export data',
    },
    {
      key: 't',
      ctrl: true,
      handler: () => setTemplatesDialogOpen(true),
      description: 'Open templates',
    },
  ]);

  // Auto-select first month if none selected
  useEffect(() => {
    if (!activeMonthId && months.length > 0) {
      setActiveMonth(months[0].id);
    }
  }, [activeMonthId, months, setActiveMonth]);

  const activeMonth = activeMonthId ? getMonth(activeMonthId) : null;
  const totals = activeMonth ? getBucketTotals(activeMonthId!) : null;

  const handleImport = useCallback(
    (importedMonths: PlannedMonthSnapshot[]) => {
      seedMonths(importedMonths);
      if (importedMonths.length > 0) {
        setActiveMonth(importedMonths[0].id);
      }
    },
    [seedMonths, setActiveMonth],
  );

  if (months.length === 0) {
    return (
      <Stack spacing={3}>
        <EmptyState
          icon={<EditCalendarIcon sx={{ fontSize: 48 }} />}
          title="No Planned Months"
          description="No planned expense data is available. Import data or create a new month plan to get started."
          action={{
            label: 'Import Data',
            onClick: () => setImportDialogOpen(true),
            icon: <UploadFileIcon />,
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <MonthSearchFilter months={months} onFilterChange={setFilteredMonths} />
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl fullWidth size="small">
            <InputLabel id="month-select-label">Select Month</InputLabel>
            <Select
              labelId="month-select-label"
              value={activeMonthId ?? ''}
              label="Select Month"
              onChange={(e) => setActiveMonth(e.target.value)}
            >
              {filteredMonths.map((month) => (
                <MenuItem key={month.id} value={month.id}>
                  {formatMonthDate(month.monthStart)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialogOpen(true)}
            sx={{ whiteSpace: 'nowrap' }}
            disabled={months.length === 0}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={() => setTemplatesDialogOpen(true)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Templates
          </Button>
        </Stack>
      </Paper>

      {activeMonth && totals ? (
        <Stack spacing={3}>
          <MonthViewHeader
            month={activeMonth}
            onAdjustmentsClick={() => setAdjustmentsDialogOpen(true)}
          />
          <StatusRibbon month={activeMonth} />
          <AccountTable month={activeMonth} />
          <TotalsFooter month={activeMonth} totals={totals} />
        </Stack>
      ) : (
        <Paper elevation={1} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Select a month to view its planned expenses.
          </Typography>
        </Paper>
      )}

      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImport}
      />
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        months={months}
      />
      {activeMonth && (
        <>
          <ManualAdjustmentsDialog
            open={adjustmentsDialogOpen}
            onClose={() => setAdjustmentsDialogOpen(false)}
            month={activeMonth}
          />
          <TemplatesDialog
            open={templatesDialogOpen}
            onClose={() => setTemplatesDialogOpen(false)}
            month={activeMonth}
            onApplyTemplate={(templateId) => {
              // Template applied, refresh view
              setTemplatesDialogOpen(false);
            }}
          />
        </>
      )}
    </Stack>
  );
});
