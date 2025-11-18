/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 * instead of crashing the entire app. This is a React error boundary implementation.
 * 
 * @component
 * @example
 * ```tsx
 * <ErrorBoundary onReset={() => window.location.reload()}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */

import { Component, type ReactNode } from 'react';
import { Box, Button, Paper, Stack, Typography, Alert, AlertTitle } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { captureException, ErrorSeverity } from '../../utils/errorTracking';

/**
 * Props for ErrorBoundary component
 * @interface
 */
interface ErrorBoundaryProps {
  /** Child components to be wrapped by the error boundary */
  children: ReactNode;
  /** Optional custom fallback UI to display when an error occurs */
  fallback?: ReactNode;
  /** Optional callback function to execute when reset button is clicked */
  onReset?: () => void;
}

/**
 * Internal state for ErrorBoundary component
 * @interface
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error object that was caught */
  error: Error | null;
}

/**
 * ErrorBoundary class component
 * Implements React error boundary pattern to catch and handle errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error using error tracking utility (production-safe)
    captureException(error, {
      component: 'ErrorBoundary',
      action: 'component-error',
      metadata: {
        componentStack: import.meta.env.DEV ? errorInfo.componentStack : undefined,
      },
    }, ErrorSeverity.CRITICAL);
  }

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', p: 3 }}>
          <Paper elevation={1} sx={{ p: 4, borderRadius: 3, maxWidth: 600, width: '100%' }}>
            <Stack spacing={3} alignItems="center">
              <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />
              <Typography variant="h4" component="h1">
                Something went wrong
              </Typography>
              <Alert severity="error" sx={{ width: '100%' }}>
                <AlertTitle>Error Details</AlertTitle>
                <Typography variant="body2">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Typography>
              </Alert>
              <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                  size="large"
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  size="large"
                >
                  Go Home
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
                If the problem persists, try refreshing the page or clearing your browser cache.
                You can also try going back to the home page.
              </Typography>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

