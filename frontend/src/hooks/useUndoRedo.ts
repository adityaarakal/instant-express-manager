/**
 * Undo/Redo Hook
 * Provides easy access to undo/redo functionality with keyboard shortcuts
 */

import { useEffect } from 'react';
import { useCommandHistoryStore } from '../store/useCommandHistoryStore';

export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo, getHistoryDescription } = useCommandHistoryStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Z (or Cmd+Z on Mac) for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
      // Check for Ctrl+Y or Ctrl+Shift+Z (or Cmd+Shift+Z on Mac) for redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey)
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    lastAction: getHistoryDescription(),
  };
}

