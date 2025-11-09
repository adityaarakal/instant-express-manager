import { FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material';

export function Settings() {
  return (
    <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
      <Stack spacing={3}>
        <div>
          <Typography variant="h5">Workspace Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure defaults that align with your Planned Expenses spreadsheet.
          </Typography>
        </div>
        <TextField label="Base Currency" defaultValue="INR" helperText="Matches Excel currency." />
        <TextField label="Fixed Factor (₹)" defaultValue="1000" type="number" />
        <FormControlLabel control={<Switch defaultChecked />} label="Enable reminders" />
        <FormControlLabel control={<Switch defaultChecked />} label="Auto-save local changes" />
      </Stack>
    </Paper>
  );
}

