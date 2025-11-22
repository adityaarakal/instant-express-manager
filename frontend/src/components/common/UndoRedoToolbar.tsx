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
    <Stack direction="row" spacing={0.5}>
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
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

