import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl/Cmd', 'N'], description: 'New transaction/EMI/recurring (on respective pages)' },
  { keys: ['Ctrl/Cmd', 'S'], description: 'Save form (when in a dialog)' },
  { keys: ['Ctrl/Cmd', 'K'], description: 'Focus search/filter' },
  { keys: ['Escape'], description: 'Close dialog or cancel action' },
  { keys: ['?'], description: 'Show keyboard shortcuts help' },
];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <KeyboardIcon />
          <Typography variant="h6">Keyboard Shortcuts</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {shortcuts.map((shortcut, index) => (
            <Box key={index}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{shortcut.description}</Typography>
                <Stack direction="row" spacing={0.5}>
                  {shortcut.keys.map((key, keyIndex) => (
                    <Box key={keyIndex}>
                      <kbd
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.06)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span style={{ margin: '0 4px' }}>+</span>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Stack>
              {index < shortcuts.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

