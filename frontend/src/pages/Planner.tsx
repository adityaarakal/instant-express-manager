import { Button, Paper, Stack, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';

export function Planner() {
  return (
    <Stack spacing={3}>
      <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Excel Automation Setup</Typography>
          <Typography variant="body1" color="text.secondary">
            Bring the Planned Expenses spreadsheet to life by creating a month plan. Start
            by importing the Excel data or draft a fresh allocation directly in the app.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              sx={{ flexBasis: 'fit-content' }}
            >
              Import Planned Expenses Sheet
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditCalendarIcon />}
              sx={{ flexBasis: 'fit-content' }}
            >
              Create Month Manually
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Next steps</Typography>
          <Typography variant="body2" color="text.secondary">
            • Define month-level metadata like salary, notes, and fixed factor.<br />
            • Add account allocations mapped to Excel columns (Fixed, Savings, SIPs, Bills).<br />
            • Track Pending vs Paid status for each allocation to mirror Excel logic.
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}

