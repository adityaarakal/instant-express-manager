import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Alert,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';
import { useTemplatesStore } from '../../store/useTemplatesStore';
import { usePlannedMonthsStore } from '../../store/usePlannedMonthsStore';

interface TemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  month: PlannedMonthSnapshot | null;
  onApplyTemplate?: (templateId: string) => void;
}

export function TemplatesDialog({
  open,
  onClose,
  month,
  onApplyTemplate,
}: TemplatesDialogProps) {
  const { templates, saveTemplate, deleteTemplate, useTemplate } = useTemplatesStore();
  const { updateAccountAllocation } = usePlannedMonthsStore();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const handleSaveTemplate = () => {
    if (!month || !templateName.trim()) {
      return;
    }

    saveTemplate({
      name: templateName.trim(),
      description: templateDescription.trim() || undefined,
      accounts: month.accounts.map((acc) => ({ ...acc })),
    });

    setTemplateName('');
    setTemplateDescription('');
    setShowSaveForm(false);
  };

  const handleApplyTemplate = (templateId: string) => {
    if (!month || !onApplyTemplate) {
      return;
    }

    const template = useTemplatesStore.getState().getTemplate(templateId);
    if (!template) {
      return;
    }

    // Apply template accounts to current month
    template.accounts.forEach((templateAccount) => {
      const existingAccount = month.accounts.find(
        (acc) => acc.accountId === templateAccount.accountId,
      );

      if (existingAccount) {
        updateAccountAllocation(month.id, existingAccount.id, {
          fixedBalance: templateAccount.fixedBalance,
          savingsTransfer: templateAccount.savingsTransfer,
          bucketAmounts: { ...templateAccount.bucketAmounts },
        });
      }
    });

    useTemplate(templateId);
    onApplyTemplate(templateId);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Allocation Templates</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Save current month's allocations as a template to quickly apply them to other months.
            </Typography>
            {month && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowSaveForm(true)}
                fullWidth
                sx={{ mb: 2 }}
              >
                Save Current Month as Template
              </Button>
            )}
            {!month && (
              <Alert severity="info">Select a month to save it as a template.</Alert>
            )}
          </Box>

          {showSaveForm && month && (
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Stack spacing={2}>
                <TextField
                  label="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g., Standard Monthly Allocation"
                />
                <TextField
                  label="Description (Optional)"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowSaveForm(false);
                      setTemplateName('');
                      setTemplateDescription('');
                    }}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim()}
                    fullWidth
                  >
                    Save Template
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Saved Templates ({templates.length})
            </Typography>
            {templates.length === 0 ? (
              <Alert severity="info">No templates saved yet.</Alert>
            ) : (
              <List>
                {templates.map((template) => (
                  <ListItem
                    key={template.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1">{template.name}</Typography>
                          {template.useCount > 0 && (
                            <Chip
                              label={`Used ${template.useCount}x`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {template.description || 'No description'}
                          {template.lastUsed && (
                            <> • Last used: {new Date(template.lastUsed).toLocaleDateString()}</>
                          )}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        {month && (
                          <IconButton
                            edge="end"
                            onClick={() => handleApplyTemplate(template.id)}
                            color="primary"
                            title="Apply to current month"
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteTemplate(template.id)}
                          color="error"
                          title="Delete template"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

