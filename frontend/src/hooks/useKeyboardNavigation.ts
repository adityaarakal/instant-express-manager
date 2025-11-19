/**
 * Enhanced Keyboard Navigation Hook
 * 
 * Provides comprehensive keyboard navigation for tables, forms, and interactive elements.
 * Supports arrow keys, Tab, Enter, Escape, and other power user shortcuts.
 */

import { useEffect, useRef, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  /**
   * Enable arrow key navigation between table cells/rows
   */
  enableArrowKeys?: boolean;
  /**
   * Enable Tab navigation between editable fields
   */
  enableTabNavigation?: boolean;
  /**
   * Enable Enter to save and move down (for forms)
   */
  enableEnterToSave?: boolean;
  /**
   * Enable Escape to cancel/close dialogs
   */
  enableEscapeToCancel?: boolean;
  /**
   * Custom handler for arrow key navigation
   */
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right', event: KeyboardEvent) => void;
  /**
   * Custom handler for Enter key
   */
  onEnter?: (event: KeyboardEvent) => void;
  /**
   * Custom handler for Escape key
   */
  onEscape?: (event: KeyboardEvent) => void;
  /**
   * Custom handler for Tab key
   */
  onTab?: (event: KeyboardEvent, isShift: boolean) => void;
  /**
   * Whether navigation is currently enabled
   */
  enabled?: boolean;
  /**
   * Element ref to focus when navigation starts
   */
  focusTargetRef?: React.RefObject<HTMLElement>;
}

/**
 * Enhanced keyboard navigation hook
 * 
 * @example
 * ```tsx
 * const { focusRef } = useKeyboardNavigation({
 *   enableArrowKeys: true,
 *   enableEnterToSave: true,
 *   onEnter: () => handleSave(),
 *   onEscape: () => handleCancel(),
 * });
 * ```
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    enableArrowKeys = false,
    enableTabNavigation = true,
    enableEnterToSave = false,
    enableEscapeToCancel = true,
    onArrowKey,
    onEnter,
    onEscape,
    onTab,
    enabled = true,
    focusTargetRef,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Arrow keys navigation (only when not in input fields, unless explicitly enabled)
      if (enableArrowKeys && (!isInput || event.ctrlKey || event.metaKey)) {
        switch (event.key) {
          case 'ArrowUp':
            if (onArrowKey) {
              onArrowKey('up', event);
            } else {
              navigateTableRow(target, 'up', event);
            }
            break;
          case 'ArrowDown':
            if (onArrowKey) {
              onArrowKey('down', event);
            } else {
              navigateTableRow(target, 'down', event);
            }
            break;
          case 'ArrowLeft':
            if (onArrowKey) {
              onArrowKey('left', event);
            } else {
              navigateTableCell(target, 'left', event);
            }
            break;
          case 'ArrowRight':
            if (onArrowKey) {
              onArrowKey('right', event);
            } else {
              navigateTableCell(target, 'right', event);
            }
            break;
        }
      }

      // Enter key - save and move down (for forms)
      if (enableEnterToSave && event.key === 'Enter' && !event.shiftKey) {
        if (isInput && target.tagName === 'TEXTAREA') {
          // Allow Enter in textareas unless Ctrl/Cmd is pressed
          if (!event.ctrlKey && !event.metaKey) {
            return;
          }
        }
        if (onEnter) {
          event.preventDefault();
          onEnter(event);
        } else if (isInput) {
          // Default behavior: move to next field
          event.preventDefault();
          moveToNextField(target);
        }
      }

      // Escape key - cancel/close
      if (enableEscapeToCancel && event.key === 'Escape') {
        if (onEscape) {
          event.preventDefault();
          onEscape(event);
        } else {
          // Default behavior: blur current input
          if (isInput) {
            target.blur();
          }
        }
      }

      // Tab navigation enhancement
      if (enableTabNavigation && event.key === 'Tab') {
        if (onTab) {
          // Allow custom Tab handling
          onTab(event, event.shiftKey);
        }
        // Default Tab behavior is already handled by browser
      }
    },
    [
      enabled,
      enableArrowKeys,
      enableEnterToSave,
      enableEscapeToCancel,
      enableTabNavigation,
      onArrowKey,
      onEnter,
      onEscape,
      onTab,
    ],
  );

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current || document;
    const handler = handleKeyDown as (event: Event) => void;
    container.addEventListener('keydown', handler);

    return () => {
      container.removeEventListener('keydown', handler);
    };
  }, [enabled, handleKeyDown]);

  // Focus target on mount if provided
  useEffect(() => {
    if (enabled && focusTargetRef?.current) {
      focusTargetRef.current.focus();
    }
  }, [enabled, focusTargetRef]);

  return {
    containerRef,
    focusRef: focusTargetRef,
  };
}

/**
 * Navigate to next/previous table row
 */
function navigateTableRow(currentElement: HTMLElement, direction: 'up' | 'down', event: KeyboardEvent) {
  event.preventDefault();

  const currentRow = currentElement.closest('tr');
  if (!currentRow) return;

  const table = currentRow.closest('table');
  if (!table) return;

  const rows = Array.from(table.querySelectorAll('tr'));
  const currentIndex = rows.indexOf(currentRow);

  if (direction === 'up' && currentIndex > 0) {
    const prevRow = rows[currentIndex - 1];
    const cells = Array.from(prevRow.querySelectorAll('td, th'));
    const currentCellIndex = Array.from(currentRow.querySelectorAll('td, th')).indexOf(
      currentElement.closest('td, th') as HTMLElement,
    );
    const targetCell = cells[Math.min(currentCellIndex, cells.length - 1)] as HTMLElement;
    targetCell?.focus();
  } else if (direction === 'down' && currentIndex < rows.length - 1) {
    const nextRow = rows[currentIndex + 1];
    const cells = Array.from(nextRow.querySelectorAll('td, th'));
    const currentCellIndex = Array.from(currentRow.querySelectorAll('td, th')).indexOf(
      currentElement.closest('td, th') as HTMLElement,
    );
    const targetCell = cells[Math.min(currentCellIndex, cells.length - 1)] as HTMLElement;
    targetCell?.focus();
  }
}

/**
 * Navigate to next/previous table cell
 */
function navigateTableCell(currentElement: HTMLElement, direction: 'left' | 'right', event: KeyboardEvent) {
  event.preventDefault();

  const currentCell = currentElement.closest('td, th');
  if (!currentCell) return;

  const currentRow = currentCell.closest('tr');
  if (!currentRow) return;

  const cells = Array.from(currentRow.querySelectorAll('td, th'));
  const currentIndex = cells.indexOf(currentCell as HTMLElement);

  if (direction === 'left' && currentIndex > 0) {
    (cells[currentIndex - 1] as HTMLElement)?.focus();
  } else if (direction === 'right' && currentIndex < cells.length - 1) {
    (cells[currentIndex + 1] as HTMLElement)?.focus();
  }
}

/**
 * Move to next form field
 */
function moveToNextField(currentElement: HTMLElement) {
  const form = currentElement.closest('form');
  if (!form) return;

  const fields = Array.from(
    form.querySelectorAll<HTMLElement>('input, textarea, select, button[type="submit"]'),
  ).filter((el) => {
    const type = (el as HTMLInputElement).type;
    return type !== 'hidden' && !(el as HTMLElement).hasAttribute('disabled');
  });

  const currentIndex = fields.indexOf(currentElement);
  if (currentIndex >= 0 && currentIndex < fields.length - 1) {
    fields[currentIndex + 1]?.focus();
  } else if (currentIndex === fields.length - 1) {
    // Last field - focus first field
    fields[0]?.focus();
  }
}

