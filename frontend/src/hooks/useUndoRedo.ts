/**
 * Undo/Redo Hook
 * 
 * Provides easy access to undo/redo functionality with keyboard shortcuts.
 * Automatically registers keyboard shortcuts (Ctrl+Z / Ctrl+Y).
 * 
 * @module useUndoRedo
 */

import { useEffect } from 'react';
import { useCommandHistoryStore } from '../store/useCommandHistoryStore';

/**
 * Hook for undo/redo functionality with keyboard shortcuts.
 * 
 * @returns {Object} Hook return object
 * @returns {Function} returns.undo - Function to undo last action
 * @returns {Function} returns.redo - Function to redo last undone action
 * @returns {boolean} returns.canUndo - True if undo is available
 * @returns {boolean} returns.canRedo - True if redo is available
 * @returns {string | null} returns.lastAction - Description of last action (for display)
 * 
 * **Keyboard Shortcuts**:
 * - `Ctrl+Z` (or `Cmd+Z` on Mac): Undo
 * - `Ctrl+Y` or `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac): Redo
 * 
 * @example
 * function MyComponent() {
 *   const { undo, redo, canUndo, canRedo, lastAction } = useUndoRedo();
 *   
 *   return (
 *     <div>
 *       <button onClick={undo} disabled={!canUndo}>Undo</button>
 *       <button onClick={redo} disabled={!canRedo}>Redo</button>
 *       {lastAction && <p>Last action: {lastAction}</p>}
 *     </div>
 *   );
 * }
 */
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

