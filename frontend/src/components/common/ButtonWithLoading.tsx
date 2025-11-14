import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { ReactNode } from 'react';

interface ButtonWithLoadingProps extends ButtonProps {
  loading?: boolean;
  children: ReactNode;
}

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

