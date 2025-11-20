/**
 * Command History Store
 * Implements undo/redo functionality using the command pattern
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

export interface Command {
  id: string;
  type: string;
  execute: () => void;
  undo: () => void;
  description: string;
  timestamp: string;
}

type CommandHistoryState = {
  history: Command[];
  currentIndex: number;
  maxHistorySize: number;
  
  // Actions
  executeCommand: (command: Omit<Command, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  getHistoryDescription: () => string;
};

const MAX_HISTORY_SIZE = 50;

const storage = getLocalforageStorage('command-history');

export const useCommandHistoryStore = create<CommandHistoryState>()(
  devtools(
    persist(
      (set, get) => ({
        history: [],
        currentIndex: -1,
        maxHistorySize: MAX_HISTORY_SIZE,

        executeCommand: (commandData) => {
          const command: Command = {
            ...commandData,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
          };

          // Execute the command
          command.execute();

          // Remove any commands after current index (if we're in the middle of history)
          const { history, currentIndex } = get();
          const newHistory = history.slice(0, currentIndex + 1);

          // Add new command
          newHistory.push(command);

          // Limit history size
          const trimmedHistory = newHistory.slice(-MAX_HISTORY_SIZE);

          set({
            history: trimmedHistory,
            currentIndex: trimmedHistory.length - 1,
          });
        },

        undo: () => {
          const { history, currentIndex } = get();
          if (currentIndex >= 0) {
            const command = history[currentIndex];
            command.undo();
            set({ currentIndex: currentIndex - 1 });
          }
        },

        redo: () => {
          const { history, currentIndex } = get();
          if (currentIndex < history.length - 1) {
            const nextIndex = currentIndex + 1;
            const command = history[nextIndex];
            command.execute();
            set({ currentIndex: nextIndex });
          }
        },

        canUndo: () => {
          return get().currentIndex >= 0;
        },

        canRedo: () => {
          const { history, currentIndex } = get();
          return currentIndex < history.length - 1;
        },

        clearHistory: () => {
          set({ history: [], currentIndex: -1 });
        },

        getHistoryDescription: () => {
          const { history, currentIndex } = get();
          if (currentIndex < 0 || currentIndex >= history.length) {
            return 'No actions';
          }
          return history[currentIndex].description;
        },
      }),
      {
        name: 'command-history',
        storage,
        // Only persist history, not currentIndex (reset on reload)
        partialize: (state) => ({
          history: state.history,
          maxHistorySize: state.maxHistorySize,
        }),
      },
    ),
    { name: 'CommandHistoryStore' },
  ),
);

