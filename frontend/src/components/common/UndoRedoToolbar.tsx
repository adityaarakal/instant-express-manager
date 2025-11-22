/**
 * Undo/Redo Toolbar Component
 * Displays undo/redo buttons with keyboard shortcut hints
 */

import { IconButton, Tooltip, Stack } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { useUndoRedo } from '../../hooks/useUndoRedo';

export function UndoRedoToolbar() {
  const { undo, redo, canUndo, canRedo, lastAction } = useUndoRedo();

  return (
    <Stack 
      direction="row" 
      spacing={{ xs: 0.25, sm: 0.5 }}
      sx={{ flexShrink: 0 }}
    >
      <Tooltip
        title={
          canUndo
            ? `Undo: ${lastAction} (Ctrl+Z or Cmd+Z)`
            : 'Nothing to undo'
        }
      >
        <span>
          <IconButton
            onClick={undo}
            disabled={!canUndo}
            size="small"
            aria-label="Undo last action"
            sx={{
              minWidth: { xs: 32, sm: 36, md: 40 },
              minHeight: { xs: 32, sm: 36, md: 40 },
              p: { xs: 0.5, sm: 0.75 },
            }}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={
          canRedo
            ? `Redo: ${lastAction} (Ctrl+Y or Cmd+Y)`
            : 'Nothing to redo'
        }
      >
        <span>
          <IconButton
            onClick={redo}
            disabled={!canRedo}
            size="small"
            aria-label="Redo last action"
            sx={{
              minWidth: { xs: 32, sm: 36, md: 40 },
              minHeight: { xs: 32, sm: 36, md: 40 },
              p: { xs: 0.5, sm: 0.75 },
            }}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

