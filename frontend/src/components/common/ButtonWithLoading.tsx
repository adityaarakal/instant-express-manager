/**
 * Button with Loading State Component
 * 
 * A Material-UI Button wrapper that shows a loading spinner when an async operation is in progress.
 * The button is automatically disabled while loading to prevent multiple simultaneous actions.
 * 
 * @component
 * @example
 * ```tsx
 * <ButtonWithLoading
 *   variant="contained"
 *   loading={isSubmitting}
 *   onClick={handleSubmit}
 * >
 *   Submit
 * </ButtonWithLoading>
 * ```
 */

import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { ReactNode } from 'react';

/**
 * Props for ButtonWithLoading component
 * Extends Material-UI ButtonProps with additional loading functionality
 * @interface
 */
interface ButtonWithLoadingProps extends ButtonProps {
  /** Whether the button is in a loading state (shows spinner and disables button) */
  loading?: boolean;
  /** Button content/label */
  children: ReactNode;
}

/**
 * Button component with integrated loading state
 * Displays a spinner and disables the button while loading
 * 
 * @param props - ButtonWithLoadingProps including loading state and standard Button props
 * @returns Button component with loading spinner
 */
export function ButtonWithLoading({ loading, children, disabled, ...props }: ButtonWithLoadingProps) {
  return (
    <Button {...props} disabled={disabled || loading}>
      {loading && (
        <CircularProgress
          size={16}
          sx={{ mr: 1 }}
          color="inherit"
        />
      )}
      {children}
    </Button>
  );
}

